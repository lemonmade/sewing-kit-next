import {resolve, join} from 'path';
// import {produce} from 'immer';
import {Work, Runtime, BuildType, BrowserAppDiscovery} from '../concepts';

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
          id: 'main',
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
      const extensions = await build.hooks.extensions.promise(
        ['.js', '.jsx', '.mjs', '.json'],
        target,
      );

      return {
        ...config,
        mode: 'development',
        entry: target.roots,
        output: {
          path: resolve(workspace.root, 'build/browser', target.id),
        },
        resolve: {extensions},
        module: {rules},
      };
    });
  });
}
