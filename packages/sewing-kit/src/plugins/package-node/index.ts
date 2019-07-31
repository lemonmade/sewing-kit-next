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
  work.tasks.test.tap(PLUGIN, ({hooks}) => {
    hooks.configureProject.tap(PLUGIN, ({hooks}) => {
      hooks.extensions.tap(PLUGIN, (extensions) => [EXTENSION, ...extensions]);
    });
  });

  work.tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.variants.tap(PLUGIN, (variants) => [
        ...variants,
        {[VARIANT]: true},
      ]);

      hooks.configure.tap(PLUGIN, (configurationHooks, {node}) => {
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

      hooks.steps.tapPromise(
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
