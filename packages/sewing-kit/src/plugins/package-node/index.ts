import {join} from 'path';
import {produce} from 'immer';

import {Work} from '../../work';
import {
  changeBabelPreset,
  updateBabelPreset,
  CompileBabelStep,
  WriteEntriesStep,
} from '../utilities';

const PLUGIN = 'SewingKit.package-commonjs';
const VARIANT = 'node';
const EXTENSION = '.node';

declare module '../../tasks/build/types' {
  interface PackageBuildOptions {
    [VARIANT]: boolean;
  }
}

export default function packageNode(work: Work) {
  work.tasks.test.tap(PLUGIN, (_, test) => {
    test.configure.common.tap(PLUGIN, (configuration) => {
      configuration.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift(EXTENSION);
        }),
      );
    });
  });

  work.tasks.build.tap(PLUGIN, (workspace, buildTaskHooks) => {
    buildTaskHooks.package.tap(PLUGIN, (pkg, buildHooks) => {
      buildHooks.variants.tap(PLUGIN, (variants) => [
        ...variants,
        {[VARIANT]: true},
      ]);

      buildHooks.configure.tap(PLUGIN, (configurationHooks, {node}) => {
        if (!node) {
          return;
        }

        configurationHooks.babel.tap(PLUGIN, (babelConfig) => {
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

        configurationHooks.output.tap(PLUGIN, (output) => join(output, 'node'));
      });

      buildHooks.steps.tapPromise(
        PLUGIN,
        async (steps, {config, variant: {node}}) => {
          if (!node) {
            return steps;
          }

          const outputPath = await config.output.promise(pkg.fs.buildPath());

          return produce(steps, (steps) => {
            steps.push(
              new CompileBabelStep(pkg, workspace, config, {
                outputPath,
                configFile: 'babel.node.js',
              }),
              new WriteEntriesStep(pkg, {
                outputPath,
                extension: EXTENSION,
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
