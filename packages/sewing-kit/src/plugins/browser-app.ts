import {resolve} from 'path';
import {produce} from 'immer';

import {Work} from '../work';
import {Runtime} from '../concepts';

const PLUGIN = 'SewingKit.browserApp';

export default function browserApp(work: Work) {
  work.tasks.discovery.tap(PLUGIN, (discovery) => {
    discovery.hooks.discover.tapPromise(PLUGIN, async (root) => {
      await discovery.addBrowserApp({
        name: 'main',
        options: {},
        runtime: Runtime.Browser,
        roots: [resolve(root, 'client')],
        assets: {scripts: true, styles: true, images: true, files: true},
      });
    });
  });

  work.tasks.build.tap(PLUGIN, (build, _, workspace) => {
    build.webpack.browser.tap(PLUGIN, (browserBuild) => {
      browserBuild.configuration.hooks.babel.tap(PLUGIN, (babelConfig) => {
        return produce(babelConfig, (babelConfig) => {
          babelConfig.presets.push([
            'babel-preset-shopify/web',
            {modules: false},
          ]);
        });
      });

      browserBuild.hooks.config.tapPromise(PLUGIN, async (config) => {
        const variantPart = browserBuild.variants
          .map(({name, value}) => `${name}/${value}`)
          .join('/');

        return produce(config, (config) => {
          config.entry = browserBuild.app.roots;

          config.output = config.output || {};
          config.output.filename = `${browserBuild.app.name}/${variantPart}/[name].js`;
          config.output.path = resolve(workspace.root, 'build/browser');
        });
      });
    });
  });
}
