import {join} from 'path';
import {produce} from 'immer';

import {Work} from '../work';
import {
  updateBabelPreset,
  CompileBabelStep,
  WriteEntriesStep,
} from './utilities';

const PLUGIN = 'SewingKit.package-commonjs';
const VARIANT = 'commonjs';

declare module '../tasks/build/types' {
  interface PackageBuildOptions {
    [VARIANT]: boolean;
  }
}

export default function packageCommonJs(work: Work) {
  work.tasks.build.tap(PLUGIN, (workspace, buildTaskHooks) => {
    buildTaskHooks.package.tap(PLUGIN, (pkg, buildHooks) => {
      buildHooks.variants.tap(PLUGIN, (variants) => [
        ...variants,
        {[VARIANT]: true},
      ]);

      buildHooks.configure.tap(PLUGIN, (configurationHooks, {commonjs}) => {
        if (!commonjs) {
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
              {modules: 'commonjs'},
            ),
          );
        });

        configurationHooks.output.tap(PLUGIN, (output) => join(output, 'cjs'));
      });

      buildHooks.steps.tapPromise(
        PLUGIN,
        async (steps, {config, variant: {commonjs}}) => {
          if (!commonjs) {
            return steps;
          }

          const outputPath = await config.output.promise(pkg.fs.buildPath());

          return produce(steps, (steps) => {
            steps.push(
              new CompileBabelStep(pkg, workspace, config, {
                outputPath,
                configFile: 'babel.cjs.js',
              }),
              new WriteEntriesStep(pkg, {
                outputPath,
                extension: '.js',
                contents: (relative) =>
                  `module.exports = require(${JSON.stringify(relative)});`,
              }),
            );
          });
        },
      );
    });
  });
}
