import {produce} from 'immer';
import {BuildTask} from '../../tasks/build';
import {updateBabelPreset} from '../utilities';
import {PLUGIN} from './common';

function addTsExtensions(extensions: string[]) {
  return ['.ts', '.tsx', ...extensions];
}

const updateBabelPresets = produce(
  updateBabelPreset(
    [
      'babel-preset-shopify',
      'babel-preset-shopify/web',
      'babel-preset-shopify/node',
    ],
    {typescript: true},
  ),
);

export default function buildTypeScript({hooks}: BuildTask) {
  hooks.package.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.extensions.tap(PLUGIN, addTsExtensions);

      if (configurationHooks.babelConfig) {
        configurationHooks.babelConfig.tap(PLUGIN, updateBabelPresets);
      }
    });
  });

  hooks.webApp.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.extensions.tap(PLUGIN, addTsExtensions);

      if (configurationHooks.babelConfig) {
        configurationHooks.babelConfig.tap(PLUGIN, updateBabelPresets);
      }

      if (configurationHooks.webpackRules) {
        configurationHooks.webpackRules.tapPromise(PLUGIN, async (rules) => {
          const options =
            configurationHooks.babelConfig &&
            (await configurationHooks.babelConfig.promise({
              presets: [],
            }));

          return produce(rules, (rules) => {
            rules.push({
              test: /\.tsx?/,
              exclude: /node_modules/,
              loader: 'babel-loader',
              options,
            });
          });
        });
      }
    });
  });
}
