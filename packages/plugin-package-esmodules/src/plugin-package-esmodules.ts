import {join} from 'path';
import {produce} from 'immer';

import {createRootPlugin} from '@sewing-kit/plugin-utilities';
import {createWriteEntriesStep} from '@sewing-kit/plugin-package-utilities';
import {
  updateBabelPreset,
  createCompileBabelStep,
} from '@sewing-kit/plugin-babel';

const PLUGIN = 'SewingKit.package-esmodules';
const VARIANT = 'esmodules';

declare module '@sewing-kit/core/build/ts/tasks/build/types' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

export default createRootPlugin(PLUGIN, (tasks) => {
  tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.variants.tap(PLUGIN, (variants) => [
        ...variants,
        {[VARIANT]: true},
      ]);

      hooks.configure.tap(PLUGIN, (configurationHooks, {esmodules}) => {
        if (!esmodules) {
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
                {modules: false},
              ),
            );
          });
        }

        configurationHooks.output.tap(PLUGIN, (output) => join(output, 'esm'));
      });

      hooks.steps.tapPromise(
        PLUGIN,
        async (steps, {config, variant: {esmodules}}) => {
          if (!esmodules) {
            return steps;
          }

          const outputPath = await config.output.promise(pkg.fs.buildPath());

          return produce(steps, (steps) => {
            steps.push(
              createCompileBabelStep(pkg, workspace, config, {
                outputPath,
                configFile: 'babel.esm.js',
              }),
              createWriteEntriesStep(pkg, {
                outputPath,
                extension: '.mjs',
                contents: (relative) =>
                  `export * from ${JSON.stringify(relative)};`,
              }),
            );
          });
        },
      );
    });
  });
});
