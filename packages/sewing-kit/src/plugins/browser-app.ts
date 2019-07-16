import {resolve, join} from 'path';
// import {produce} from 'immer';

import {Work} from '../work';
import {BrowserAppDiscovery} from '../discovery';
import {Runtime, BuildType} from '../concepts';

const PLUGIN = 'SewingKit.browserApp';

export default function browserApp(work: Work) {
  work.hooks.discovery.tap(PLUGIN, (discovery) => {
    discovery.hooks.discover.tapPromise(PLUGIN, async (root) => {
      const browserAppDiscovery = new BrowserAppDiscovery({
        name: 'main',
        root: join(root, 'client'),
        entries: new Set(),
      });

      browserAppDiscovery.hooks.discover.tapPromise(PLUGIN, async () => {
        await browserAppDiscovery.addEntry({
          name: 'main',
          type: BuildType.Browser,
          options: {},
          variants: [],
          runtime: Runtime.Browser,
          roots: [resolve(root, 'client')],
          assets: {scripts: true, styles: true, images: true, files: true},
        });
      });

      await discovery.addBrowserApp(browserAppDiscovery);
    });
  });

  work.hooks.build.tap(PLUGIN, (build, workspace) => {
    build.hooks.config.tapPromise(PLUGIN, async (config, target) => {
      if (target.type !== BuildType.Browser) {
        return config;
      }

      const rules = await build.hooks.rules.promise([], target);
      const extensions = await build.hooks.extensions.promise([], target);

      const variantPart = target.variants
        .map(({name, value}) => `${name}/${value}`)
        .join('/');

      return {
        ...config,
        mode: 'development',
        entry: {[target.name]: target.roots},
        output: {
          filename: '[name].js',
          path: resolve(
            workspace.root,
            'build/browser',
            target.name,
            variantPart,
          ),
        },
        resolve: {extensions},
        module: {rules},
      };
    });
  });
}
