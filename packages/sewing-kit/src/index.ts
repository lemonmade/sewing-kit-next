import webpack, {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncParallelHook} from 'tapable';

import {Work} from './work';
import {Build} from './build';
import {BrowserEntry} from './concepts';
import {WorkspaceDiscovery} from './discovery';

const webPlugin = makePlugin(() => import('./plugins/web'));
const typescriptPlugin = makePlugin(() => import('./plugins/typescript'));
const browserAppPlugin = makePlugin(() => import('./plugins/browser-app'));
const differentialServingPlugin = makePlugin(() =>
  import('./plugins/differential-serving'),
);
const javascriptPlugin = makePlugin(() => import('./plugins/javascript'));
const jsonPlugin = makePlugin(() => import('./plugins/json'));

export interface Options {
  root: string;
  plugins?: ((work: Work) => void)[];
}

export async function run({root, plugins = []}: Options) {
  const work = await init(plugins);

  const discovery = new WorkspaceDiscovery(root);
  work.hooks.discovery.call(discovery);
  const workspace = await discovery.discover();

  const build = new Build();
  work.hooks.build.call(build, workspace);

  const buildTargets = [...workspace.browserApps].reduce<BrowserEntry[]>(
    (all, app) => {
      return [...all, ...app.entries];
    },
    [],
  );

  await Promise.all(
    buildTargets.map(async (buildTarget) => {
      const config = await build.hooks.config.promise(
        {
          mode: 'development',
        },
        buildTarget,
      );

      await buildWebpack(config);
    }),
  );
}

async function init(plugins: ((work: Work) => void)[]) {
  const work = new Work();

  const rootHook = new AsyncParallelHook(['work']);

  rootHook.tapPromise('SewingKit.browserApp', browserAppPlugin);
  rootHook.tapPromise('SewingKit.web', webPlugin);
  rootHook.tapPromise('SewingKit.json', jsonPlugin);
  rootHook.tapPromise('SewingKit.javascript', javascriptPlugin);
  rootHook.tapPromise('SewingKit.typescript', typescriptPlugin);
  rootHook.tapPromise(
    'SewingKit.differentialServing',
    differentialServingPlugin,
  );

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
