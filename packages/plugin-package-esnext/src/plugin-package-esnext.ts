import {produce} from 'immer';

import {Runtime} from '@sewing-kit/core';
import {createRootPlugin} from '@sewing-kit/plugin-utilities';
import {createWriteEntriesStep} from '@sewing-kit/plugin-package-utilities';
import {
  updateBabelPreset,
  createCompileBabelStep,
} from '@sewing-kit/plugin-babel';
import {} from '@sewing-kit/plugin-package-base';

const PLUGIN = 'SewingKit.package-esnext';
const VARIANT = 'esnext';
const EXTENSION = '.esnext';

declare module '@sewing-kit/core/build/ts/tasks/build/types' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

export default createRootPlugin(PLUGIN, (tasks) => {
  tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
    hooks.configure.tap(PLUGIN, (hooks) => {
      if (hooks.packageBuildArtifacts) {
        hooks.packageBuildArtifacts.tapPromise(PLUGIN, async (artifacts) => [
          ...artifacts,
          ...workspace.packages.map((pkg) => pkg.fs.buildPath('esnext')),
          ...(await Promise.all(
            workspace.packages.map((pkg) => pkg.fs.glob(`./*${EXTENSION}`)),
          )).flat(),
        ]);
      }
    });

    hooks.webApp.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, (configurationHooks) => {
        configurationHooks.extensions.tap(PLUGIN, (extensions) => [
          EXTENSION,
          ...extensions,
        ]);
      });
    });

    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.variants.tap(PLUGIN, (variants) => {
        // If all the entries are Node entries, there is no point in producing
        // an un-compiled build, because the CommonJS build will already be tailored
        // to the baseline version of Node.
        if (pkg.entries.every(({runtime}) => runtime === Runtime.Node)) {
          return variants;
        }

        return [...variants, {[VARIANT]: true}];
      });

      hooks.configure.tap(PLUGIN, (configurationHooks, {esnext}) => {
        if (!esnext) {
          return;
        }

        if (configurationHooks.babelConfig) {
          configurationHooks.babelConfig.tap(PLUGIN, (babelConfig) => {
            return produce(
              babelConfig,
              updateBabelPreset(
                [
                  'babel-preset-shopify',
                  'babel-preset-shopify/web',
                  'babel-preset-shopify/node',
                ],
                {
                  modules: false,
                  browsers: ['last 1 chrome version'],
                },
              ),
            );
          });
        }
      });

      hooks.steps.tap(PLUGIN, (steps, {config, variant: {esnext}}) => {
        if (!esnext) {
          return steps;
        }

        const outputPath = pkg.fs.buildPath('esnext');

        return produce(steps, (steps) => {
          steps.push(
            createCompileBabelStep(pkg, workspace, config, {
              outputPath,
              configFile: 'babel.esnext.js',
            }),
            createWriteEntriesStep(pkg, {
              outputPath,
              extension: EXTENSION,
              exclude: (entry) => entry.runtime === Runtime.Node,
              contents: (relative) =>
                `export * from ${JSON.stringify(
                  relative,
                )};\nexport {default} from ${JSON.stringify(relative)};`,
            }),
          );
        });
      });
    });
  });
});
