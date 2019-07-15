import {resolve} from 'path';
import webpack, {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncSeriesHook} from 'tapable';

import {
  Work,
  Configuration,
  Build,
  Workspace,
  Runtime,
  BrowserEntry,
  BuildType,
} from './concepts';

const webPlugin = makePlugin(() => import('./plugins/web'));
const typescriptPlugin = makePlugin(() => import('./plugins/typescript'));

export interface Options {
  root: string;
  plugins?: ((work: Work) => void)[];
}

export async function run({root, plugins = []}: Options) {
  const work = await init(plugins);
  const configuration = new Configuration();
  const build = new Build(configuration);

  work.hooks.configure.call(configuration);
  work.hooks.build.call(build);

  const workspace = await discover(root);

  const browserEntries = [...workspace.browserApps].reduce<BrowserEntry[]>(
    (all, app) => {
      return [...all, ...app.entries];
    },
    [],
  );

  await Promise.all(
    browserEntries.map(async (browserEntry) => {
      const rules = await build.hooks.rules.promise([], browserEntry);
      const extensions = await build.hooks.extensions.promise([
        '.js',
        '.jsx',
        '.mjs',
        '.json',
      ], browserEntry);

      const config = await build.hooks.config.promise({
        mode: 'development',
        entry: browserEntry.roots,
        output: {
          path: resolve(root, 'build/browser', browserEntry.id),
        },
        resolve: {extensions},
        module: {rules},
      });

      await buildWebpack(config);
    }),
  );
}

async function init(plugins: ((work: Work) => void)[]) {
  const work = new Work();

  const rootHook = new AsyncSeriesHook(['work']);

  rootHook.tapPromise('SewingKit.web', webPlugin);
  rootHook.tapPromise('SewingKit.typescript', typescriptPlugin);

  for (const plugin of plugins) {
    rootHook.tapPromise('custom', forcePromiseTap(plugin));
  }

  await rootHook.promise(work);

  return work;
}

function forcePromiseTap(plugin: (...args: any[]) => unknown) {
  return (...args: any[]): Promise<void> => {
    try {
      const result = plugin(...args);
      return typeof result !== 'object' || result == null || !('then' in result)
        ? Promise.resolve<void>(result as any)
        : (result as any);
    } catch (error) {
      return Promise.reject(error);
    }
  };
}

function discover(root: string) {
  const workspace = new Workspace();

  workspace.browserApps.add({
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

  return workspace;
}

function buildWebpack(config: WebpackConfiguration) {
  const compiler = webpack(config);

  return new Promise((resolve) => {
    compiler.run((_error, _stats) => {
      resolve();
    });
  });
}

function makePlugin<Arg>(load: () => Promise<{default: (arg: Arg) => void}>) {
  return async (arg: Arg) => {
    return (await load()).default(arg);
  };
}
