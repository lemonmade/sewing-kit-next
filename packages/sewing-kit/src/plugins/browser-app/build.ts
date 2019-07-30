import {join} from 'path';
import {produce} from 'immer';

import {BuildTaskHooks} from '../../tasks/build';
import {Workspace} from '../../workspace';
import {changeBabelPreset, updateBabelPreset} from '../utilities';

import {PLUGIN} from './common';

export default function browserAppBuild(
  workspace: Workspace,
  build: BuildTaskHooks,
) {
  build.webApp.tap(PLUGIN, (app, buildHooks) => {
    const changePreset = changeBabelPreset(
      'babel-preset-shopify',
      'babel-preset-shopify/web',
    );

    const updatePreset = updateBabelPreset('babel-preset-shopify/web', {
      modules: false,
    });

    buildHooks.variants.tap(PLUGIN, () => [{}]);

    buildHooks.configure.tap(PLUGIN, (configurationHooks) => {
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
        workspace.apps.length > 1 ? join(app.name, filename) : filename,
      );
    });
  });
}
