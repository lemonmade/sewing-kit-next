import {join} from 'path';
import {produce} from 'immer';

import {BuildTask} from '../../tasks/build';
import {Workspace} from '../../workspace';
import {changeBabelPreset, updateBabelPreset} from '../utilities';

import {PLUGIN} from './common';

export default function browserAppBuild(
  build: BuildTask,
  workspace: Workspace,
) {
  build.configure.browser.tap(PLUGIN, (configuration, app) => {
    const changePreset = changeBabelPreset(
      'babel-preset-shopify',
      'babel-preset-shopify/web',
    );

    const updatePreset = updateBabelPreset('babel-preset-shopify/web', {
      modules: false,
    });

    configuration.babel.tap(PLUGIN, (babelConfig) => {
      return produce(babelConfig, (babelConfig) => {
        changePreset(babelConfig);
        updatePreset(babelConfig);
      });
    });

    configuration.output.tap(PLUGIN, () => workspace.fs.buildPath('browser'));
    configuration.filename.tap(PLUGIN, (filename) =>
      workspace.apps.length > 1 ? join(app.name, filename) : filename,
    );
  });
}
