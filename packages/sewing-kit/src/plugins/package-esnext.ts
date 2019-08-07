import {join} from 'path';
import {produce} from 'immer';

import {Runtime} from '../types';
import {RunnerTasks} from '../runner';
import {
  updateBabelPreset,
  createCompileBabelStep,
  createWriteEntriesStep,
} from './utilities';

const PLUGIN = 'SewingKit.package-commonjs';
const VARIANT = 'esnext';
const EXTENSION = '.esnext';

declare module '../tasks/build/types' {
  interface PackageBuildOptions {
    [VARIANT]: boolean;
  }
}

export default function packageEsnext(tasks: RunnerTasks) {
  tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
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

        configurationHooks.babel.tap(PLUGIN, (babelConfig) => {
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

        configurationHooks.output.tap(PLUGIN, (output) =>
          join(output, 'esnext'),
        );
      });

      hooks.steps.tapPromise(
        PLUGIN,
        async (steps, {config, variant: {esnext}}) => {
          if (!esnext) {
            return steps;
          }

          const outputPath = await config.output.promise(pkg.fs.buildPath());

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
                  `export * from ${JSON.stringify(relative)};`,
              }),
            );
          });
        },
      );
    });
  });
}
