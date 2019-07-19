import {join} from 'path';
import {produce} from 'immer';

import {BuildTask} from '../../tasks/build';
import {Workspace} from '../../workspace';

import {PLUGIN} from './common';

export default function browserAppBuild(build: BuildTask, workspace: Workspace) {
  build.configure.browser.tap(PLUGIN, (configuration, {app}) => {
    configuration.babel.tap(PLUGIN, (babelConfig) => {
      return produce(babelConfig, (babelConfig) => {
        babelConfig.presets.push([
          'babel-preset-shopify/web',
          {modules: false},
        ]);
      });
    });

    configuration.output.tap(PLUGIN, () => workspace.fs.buildPath('browser'));
    configuration.filename.tap(PLUGIN, (filename) =>
      workspace.apps.length > 1 ? join(app.name, filename) : filename,
    );
  });
}
