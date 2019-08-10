import {produce} from 'immer';
import {BabelConfig} from '../../types';
import {BuildTask} from '../../tasks/build';
import {PLUGIN} from './common';

function addBaseBabelPreset(babelConfig: BabelConfig) {
  return produce(babelConfig, (babelConfig) => {
    babelConfig.presets = babelConfig.presets || [];
    babelConfig.presets.push('babel-preset-shopify');
  });
}

function addJsExtensions(extensions: string[]) {
  return ['.js', '.mjs', ...extensions];
}

export default function buildJavaScript({hooks}: BuildTask) {
  hooks.package.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      if (configurationHooks.babelConfig) {
        configurationHooks.babelConfig.tap(PLUGIN, addBaseBabelPreset);
      }

      configurationHooks.extensions.tap(PLUGIN, addJsExtensions);
    });
  });

  hooks.webApp.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.extensions.tap(PLUGIN, addJsExtensions);

      if (configurationHooks.babelConfig) {
        configurationHooks.babelConfig.tap(PLUGIN, addBaseBabelPreset);
      }

      if (configurationHooks.webpackRules) {
        configurationHooks.webpackRules.tapPromise(
          PLUGIN,
          async (rules, target) => {
            const options =
              configurationHooks.babelConfig &&
              (await configurationHooks.babelConfig.promise({}, target));

            return produce(rules, (rules) => {
              rules.push({
                test: /\.m?js/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options,
              });
            });
          },
        );
      }
    });
  });
}
