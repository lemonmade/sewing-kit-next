import {join} from 'path';
import {produce} from 'immer';

import {RunnerTasks} from '../runner';
import {updateBabelPreset, CompileBabelStep} from './utilities';

const PLUGIN = 'SewingKit.package-esmodules';
const VARIANT = 'esmodules';

declare module '../tasks/build/types' {
  interface PackageBuildOptions {
    [VARIANT]: boolean;
  }
}

export default function packageEsmodules(tasks: RunnerTasks) {
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

        configurationHooks.babel.tap(PLUGIN, (babelConfig) => {
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
              new CompileBabelStep(pkg, workspace, config, {
                outputPath,
                configFile: 'babel.esm.js',
              }),
            );
          });
        },
      );
    });
  });
}
