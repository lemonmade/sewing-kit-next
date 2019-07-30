import {produce} from 'immer';
import {Workspace} from '../../workspace';
import {BuildTaskHooks} from '../../tasks/build';
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

export default function buildTypeScript(
  _: Workspace,
  buildTaskHooks: BuildTaskHooks,
) {
  buildTaskHooks.package.tap(PLUGIN, (_, buildHooks) => {
    buildHooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.babel.tap(PLUGIN, updateBabelPresets);
      configurationHooks.extensions.tap(PLUGIN, addTsExtensions);
    });
  });

  buildTaskHooks.webApp.tap(PLUGIN, (_, buildHooks) => {
    buildHooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.babel.tap(PLUGIN, updateBabelPresets);
      configurationHooks.extensions.tap(PLUGIN, addTsExtensions);

      configurationHooks.webpackRules.tapPromise(PLUGIN, async (rules) => {
        const options = await configurationHooks.babel.promise({
          presets: [],
        });

        return produce(rules, (rules) => {
          rules.push({
            test: /\.tsx?/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options,
          });
        });
      });
    });
  });
}
