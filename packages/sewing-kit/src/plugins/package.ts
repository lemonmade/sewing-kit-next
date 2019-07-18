import {basename, join} from 'path';
import {produce} from 'immer';

import {Work} from '../work';
import {PackageBuild} from '../build';
import {FileSystem, Dependencies} from '../concepts';

type Target = 'cjs' | 'esm' | 'sk';

const PLUGIN = 'SewingKit.packages';
const TARGETS: Target[] = ['cjs', 'esm', 'sk'];

declare module '../build' {
  interface PackageBuildVariants {
    target: Target;
  }
}

export default function packages(work: Work) {
  work.tasks.build.tap(PLUGIN, (build) => {
    build.discovery.packages.tap(PLUGIN, (packageBuilds) => {
      return packageBuilds.flatMap<PackageBuild>((build) => {
        return TARGETS.map((target) =>
          produce(build, (build) => {
            build.variants.push({
              name: 'target',
              value: target,
            });
          }),
        );
      });
    });

    build.configure.package.tap(PLUGIN, (configuration, {variants}) => {
      configuration.output.tap(PLUGIN, (output) =>
        join(output, ...variants.map(({value}) => value)),
      );
    });
  });

  work.tasks.discovery.tap(PLUGIN, (discovery) => {
    discovery.hooks.packages.tapPromise(PLUGIN, async (packages) => {
      if (await discovery.fs.hasFile('src/index.*')) {
        const fs = new FileSystem(discovery.root);

        return produce(packages, (packages) => {
          packages.push({
            fs,
            root: discovery.root,
            name: discovery.name,
            dependencies: new Dependencies(discovery.root),
            entries: [
              {
                name: 'main',
                options: {},
                root: fs.resolvePath('src'),
              },
            ],
          });
        });
      }

      const packageMatches = await discovery.fs.glob('packages/*/');
      const newPackages = await Promise.all(
        packageMatches.map((root) => {
          const fs = new FileSystem(root);

          return {
            fs,
            root,
            name: basename(root),
            dependencies: new Dependencies(root),
            entries: [
              {
                name: 'main',
                options: {},
                root: fs.resolvePath(root, 'src'),
              },
            ],
          };
        }),
      );

      return produce(packages, (packages) => {
        packages.push(...newPackages);
      });
    });
  });
}
