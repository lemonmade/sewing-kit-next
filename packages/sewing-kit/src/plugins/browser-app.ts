import {resolve} from 'path';
// import {produce} from 'immer';
import {Work, Runtime, BuildType} from '../concepts';

const PLUGIN = 'SewingKit.browserApp';

export default function browserApp(work: Work) {
  work.hooks.discovery.tap(PLUGIN, (discovery) => {
    discovery.hooks.discover.tap(PLUGIN, async (root) => {
      await discovery.addBrowserApp({
        name: 'main',
        entries: new Set([
          {
            id: 'main',
            name: 'main',
            type: BuildType.Browser,
            options: {},
            variants: [],
            runtime: Runtime.Browser,
            roots: [resolve(root, 'client')],
            assets: {scripts: true, styles: true, images: true, files: true},
          },
        ]),
      });
    });
  });

  work.hooks.build.tap(PLUGIN, (build, workspace) => {
    build.hooks.config.tapPromise(PLUGIN, async (config, target) => {
      if (target.runtime !== Runtime.Browser) {
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
