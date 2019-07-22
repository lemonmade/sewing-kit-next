import {basename, join} from 'path';
import {pathExists} from 'fs-extra';
import {produce} from 'immer';

import {Work} from '../work';
import {Package} from '../workspace';

const PLUGIN = 'SewingKit.packages';

export default function packages(work: Work) {
  work.tasks.test.tap(PLUGIN, (test, workspace) => {
    test.configureRoot.watchIgnore.tap(
      PLUGIN,
      produce((watchIgnore: string[]) => {
        watchIgnore.push(workspace.fs.resolvePath('packages/.*/build'));
      }),
    );

    test.configure.common.tap(PLUGIN, (configuration) => {
      configuration.moduleMapper.tap(PLUGIN, (moduleMap) => {
        return workspace.packages.reduce(
          (all, pkg) => ({
            ...all,
            ...packageEntryMatcherMap(pkg),
          }),
          moduleMap,
        );
      });
    });
  });

  work.tasks.discovery.tap(PLUGIN, (discovery) => {
    discovery.hooks.packages.tapPromise(PLUGIN, async (packages) => {
      if (await discovery.fs.hasFile('sewing-kit.config.*')) {
        const configOptions = await loadConfig(discovery.root);

        return produce(packages, (packages) => {
          packages.push(
            new Package({
              root: discovery.root,
              name: discovery.name,
              binaries: [],
              entries: [{root: 'src'}],
              ...configOptions,
            }),
          );
        });
      }

      if (await discovery.fs.hasFile('src/index.*')) {
        const configOptions = await loadConfig(discovery.root);

        return produce(packages, (packages) => {
          packages.push(
            new Package({
              root: discovery.root,
              name: discovery.name,
              binaries: [],
              entries: [{root: 'src'}],
              ...configOptions,
            }),
          );
        });
      }

      const packageMatches = await discovery.fs.glob('packages/*/');
      const newPackages = await Promise.all(
        packageMatches.map(async (root) => {
          return new Package({
            root,
            name: basename(root),
            binaries: [],
            entries: [{root: 'src'}],
            ...(await loadConfig(discovery.root)),
          });
        }),
      );

      return produce(packages, (packages) => {
        packages.push(...newPackages);
      });
    });
  });
}

function packageEntryMatcherMap({runtimeName, entries, fs}: Package) {
  const map: Record<string, string> = Object.create(null);

  for (const {name, root} of entries) {
    map[
      name ? join(runtimeName, `${name}$`) : `${runtimeName}$`
    ] = fs.resolvePath(root);
  }

  return map;
}

async function loadConfig(root: string) {
  if (await pathExists(join(root, 'sewing-kit.config.js'))) {
    return defaultOrCommonJsExport(
      require(join(root, 'sewing-kit.config.js')),
    )();
  }

  if (await pathExists(join(root, 'sewing-kit.config.ts'))) {
    const {register} = await import('ts-node');
    register();

    return defaultOrCommonJsExport(
      require(join(root, 'sewing-kit.config.ts')),
    )();
  }

  return {};
}

function defaultOrCommonJsExport(module: any) {
  return module.default || module;
}
