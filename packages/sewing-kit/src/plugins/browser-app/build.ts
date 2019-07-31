import {join} from 'path';
import {produce} from 'immer';

import {BuildTask} from '../../tasks/build';
import {changeBabelPreset, updateBabelPreset} from '../utilities';

import {PLUGIN} from './common';

export default function browserAppBuild({hooks, workspace}: BuildTask) {
  hooks.webApp.tap(PLUGIN, ({webApp, hooks}) => {
    const changePreset = changeBabelPreset(
      'babel-preset-shopify',
      'babel-preset-shopify/web',
    );

    const updatePreset = updateBabelPreset('babel-preset-shopify/web', {
      modules: false,
    });

    hooks.variants.tap(PLUGIN, () => [{}]);

    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.babel.tap(PLUGIN, (babelConfig) => {
        return produce(babelConfig, (babelConfig) => {
          changePreset(babelConfig);
          updatePreset(babelConfig);
        });
      });

      configurationHooks.output.tap(PLUGIN, () =>
        workspace.fs.buildPath('browser'),
      );

      configurationHooks.filename.tap(PLUGIN, (filename) =>
        workspace.webApps.length > 1 ? join(webApp.name, filename) : filename,
      );
    });
  });
}
