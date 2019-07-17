import {resolve} from 'path';
import {produce} from 'immer';

import {Work} from '../work';
import {Runtime} from '../concepts';

const PLUGIN = 'SewingKit.browserApp';

export default function browserApp(work: Work) {
  work.tasks.discovery.tap(PLUGIN, (discovery) => {
    discovery.hooks.apps.tap(PLUGIN, (apps) => {
      return produce(apps, (apps) => {
        apps.push({
          name: 'main',
          options: {},
          runtime: Runtime.Browser,
          root: resolve(discovery.root, 'client'),
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
        const variantPart = browserBuild.variants
          .map(({name, value}) => `${name}/${value}`)
          .join('/');

        return produce(config, (config) => {
          config.entry = [browserBuild.app.root];

          config.output = config.output || {};
          config.output.filename = `${browserBuild.app.name}/${variantPart}/[name].js`;
          config.output.path = resolve(workspace.root, 'build/browser');
        });
      });
    });
  });
}
