import {join} from 'path';
import {produce} from 'immer';

import {Runtime} from '../types';
import {RunnerTasks} from '../runner';
import {
  updateBabelPreset,
  changeBabelPreset,
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

const setCommonJsModules = updateBabelPreset(
  [
    'babel-preset-shopify',
    'babel-preset-shopify/web',
    'babel-preset-shopify/node',
  ],
  {modules: 'commonjs'},
);

const setNodePreset = changeBabelPreset(
  ['babel-preset-shopify', 'babel-preset-shopify/web'],
  'babel-preset-shopify/node',
);

export default function packageCommonJs(tasks: RunnerTasks) {
  tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.variants.tap(PLUGIN, (variants) => [
        ...variants,
        {[VARIANT]: true},
      ]);

      hooks.configure.tap(PLUGIN, (configurationHooks, {commonjs}) => {
        if (!commonjs) {
          return;
        }

        configurationHooks.babel.tap(PLUGIN, (babelConfig) => {
          const allEntriesAreNode = pkg.entries.every(
            ({runtime}) => runtime === Runtime.Node,
          );

          return produce(babelConfig, (babelConfig) => {
            if (allEntriesAreNode) {
              setNodePreset(babelConfig);
            }

            setCommonJsModules(babelConfig);
          });
        });

        configurationHooks.output.tap(PLUGIN, (output) => join(output, 'cjs'));
      });

      hooks.steps.tapPromise(
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
