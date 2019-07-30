import {join} from 'path';
import {produce} from 'immer';

import {Work} from '../work';
import {
  updateBabelPreset,
  CompileBabelStep,
  WriteEntriesStep,
} from './utilities';

const PLUGIN = 'SewingKit.package-commonjs';
const VARIANT = 'esnext';
const EXTENSION = '.esnext';

declare module '../tasks/build/types' {
  interface PackageBuildOptions {
    [VARIANT]: boolean;
  }
}

export default function packageEsnext(work: Work) {
  work.tasks.build.tap(PLUGIN, (workspace, buildTaskHooks) => {
    buildTaskHooks.webApp.tap(PLUGIN, (_, buildHooks) => {
      buildHooks.configure.tap(PLUGIN, (configurationHooks) => {
        configurationHooks.extensions.tap(PLUGIN, (extensions) => [
          EXTENSION,
          ...extensions,
        ]);
      });
    });

    buildTaskHooks.package.tap(PLUGIN, (pkg, buildHooks) => {
      buildHooks.variants.tap(PLUGIN, (variants) => [
        ...variants,
        {[VARIANT]: true},
      ]);

      buildHooks.configure.tap(PLUGIN, (configurationHooks, {esnext}) => {
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

      buildHooks.steps.tapPromise(
        PLUGIN,
        async (steps, {config, variant: {esnext}}) => {
          if (!esnext) {
            return steps;
          }

          const outputPath = await config.output.promise(pkg.fs.buildPath());

          return produce(steps, (steps) => {
            steps.push(
              new CompileBabelStep(pkg, workspace, config, {
                outputPath,
                configFile: 'babel.esnext.js',
              }),
              new WriteEntriesStep(pkg, {
                outputPath,
                extension: EXTENSION,
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
