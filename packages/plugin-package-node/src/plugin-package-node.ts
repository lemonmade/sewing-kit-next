import {join} from 'path';
import {produce} from 'immer';

import {Runtime} from '@sewing-kit/core';
import {createRootPlugin} from '@sewing-kit/plugin-utilities';
import {createWriteEntriesStep} from '@sewing-kit/plugin-package-utilities';
import {
  changeBabelPreset,
  updateBabelPreset,
  createCompileBabelStep,
} from '@sewing-kit/plugin-babel';
import {} from '@sewing-kit/plugin-jest';

const PLUGIN = 'SewingKit.package-node';
const VARIANT = 'node';
const EXTENSION = '.node';

declare module '@sewing-kit/core/build/ts/tasks/build/types' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

export default createRootPlugin(PLUGIN, (tasks) => {
  tasks.test.tap(PLUGIN, ({hooks}) => {
    hooks.project.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, (hooks) => {
        if (hooks.jestExtensions) {
          hooks.jestExtensions.tap(PLUGIN, (extensions) => [
            EXTENSION,
            ...extensions,
          ]);
        }
      });
    });
  });

  tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.variants.tap(PLUGIN, (variants) => {
        // If all the entries already target node, there is no need to do a
        // node-only build (it will match the CommonJS build).
        if (pkg.entries.every(({runtime}) => runtime === Runtime.Node)) {
          return variants;
        }

        return [...variants, {[VARIANT]: true}];
      });

      hooks.configure.tap(PLUGIN, (configurationHooks, {node}) => {
        if (!node) {
          return;
        }

        if (configurationHooks.babelConfig) {
          configurationHooks.babelConfig.tap(PLUGIN, (babelConfig) => {
            return produce(babelConfig, (babelConfig) => {
              changeBabelPreset(
                ['babel-preset-shopify', 'babel-preset-shopify/web'],
                'babel-preset-shopify/node',
              )(babelConfig);

              updateBabelPreset('babel-preset-shopify/node', {
                modules: 'commonjs',
              })(babelConfig);
            });
          });
        }

        configurationHooks.output.tap(PLUGIN, (output) => join(output, 'node'));
      });

      hooks.steps.tapPromise(
        PLUGIN,
        async (steps, {config, variant: {node}}) => {
          if (!node) {
            return steps;
          }

          const outputPath = await config.output.promise(pkg.fs.buildPath());

          return produce(steps, (steps) => {
            steps.push(
              createCompileBabelStep(pkg, workspace, config, {
                outputPath,
                configFile: 'babel.node.js',
              }),
              createWriteEntriesStep(pkg, {
                outputPath,
                extension: EXTENSION,
                exclude: (entry) => entry.runtime === Runtime.Node,
                contents: (relative) =>
                  `module.exports = require(${JSON.stringify(relative)});`,
              }),
            );
          });
        },
      );
    });
  });
});