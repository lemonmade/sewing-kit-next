import {resolve, join} from 'path';
import {produce} from 'immer';

import {Work} from '../work';

const PLUGIN = 'SewingKit.browserApp';

export default function browserApp(work: Work) {
  work.tasks.discovery.tap(PLUGIN, (discovery) => {
    discovery.hooks.apps.tapPromise(PLUGIN, async (apps) => {
      if (!(await discovery.fs.hasFile('client/index.*'))) {
        return apps;
      }

      return produce(apps, (apps) => {
        apps.push({
          fs: discovery.fs,
          name: discovery.name,
          root: discovery.root,
          dependencies: discovery.dependencies,
          options: {},
          entry: resolve(discovery.root, 'client'),
          assets: {scripts: true, styles: true, images: true, files: true},
        });
      });
    });
  });

  work.tasks.build.tap(PLUGIN, (build, _, workspace) => {
    build.configure.browser.tap(PLUGIN, (configuration, browserBuild) => {
      configuration.babel.tap(PLUGIN, (babelConfig) => {
        return produce(babelConfig, (babelConfig) => {
          babelConfig.presets.push([
            'babel-preset-shopify/web',
            {modules: false},
          ]);
        });
      });

      configuration.finalize.tapPromise(PLUGIN, async (config) => {
        const {app, variants} = browserBuild;
        const variantPart = variants.map(({value}) => value).join('-');
        const appParts = workspace.apps.length > 1 ? [app.name] : [];

        return produce(config, (config) => {
          config.entry = [browserBuild.app.entry];

          config.output = config.output || {};
          config.output.filename = join(...appParts, variantPart, '[name].js');
          config.output.path = resolve(workspace.root, 'build/browser');
        });
      });
    });
  });
}
