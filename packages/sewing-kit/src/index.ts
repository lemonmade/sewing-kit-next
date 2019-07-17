import webpack, {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncParallelHook} from 'tapable';

import {Work} from './work';
import {BuildTask, Env, Configuration} from './build';
import {Project} from './concepts';
import {WorkspaceDiscovery} from './discovery';

const typescriptPlugin = makePlugin(() => import('./plugins/typescript'));
const browserAppPlugin = makePlugin(() => import('./plugins/browser-app'));
const differentialServingPlugin = makePlugin(() =>
  import('./plugins/differential-serving'),
);
const javascriptPlugin = makePlugin(() => import('./plugins/javascript'));
const jsonPlugin = makePlugin(() => import('./plugins/json'));
const packagePlugin = makePlugin(() => import('./plugins/json'));

export interface Options {
  root: string;
  plugins?: ((work: Work) => void)[];
}

export async function run({root, plugins = []}: Options) {
  const work = await init(plugins);

  const project = new Project(root);
  const discovery = new WorkspaceDiscovery(root);
  work.tasks.discovery.call(discovery, project);
  const workspace = await discovery.discover();

  const env = {actual: Env.Development, simulate: Env.Development};

  const build = new BuildTask();
  work.tasks.build.call(build, env, workspace);

  const browserBuilds = await build.discovery.apps.promise(
    [...workspace.apps].map((app) => ({
      app,
      variants: [],
    })),
  );

  await Promise.all(
    browserBuilds.map(async (browserBuild) => {
      const configuration = new Configuration();

      await build.configure.common.promise(configuration);
      await build.configure.browser.promise(configuration, browserBuild);

      const rules = await configuration.rules.promise([]);
      const extensions = await configuration.extensions.promise([]);

      const config = await configuration.finalize.promise({
        mode: toMode(env.simulate),
        resolve: {extensions},
        module: {rules},
      });

      await buildWebpack(config);
    }),
  );
}

function toMode(env: Env) {
  switch (env) {
    case Env.Production:
    case Env.Staging:
      return 'production';
    default:
      return 'development';
  }
}

async function init(plugins: ((work: Work) => void)[]) {
  const work = new Work();

  const rootHook = new AsyncParallelHook(['work']);

  rootHook.tapPromise('SewingKit.json', jsonPlugin);
  rootHook.tapPromise('SewingKit.javascript', javascriptPlugin);
  rootHook.tapPromise('SewingKit.typescript', typescriptPlugin);
  rootHook.tapPromise('SewingKit.browserApp', browserAppPlugin);
  rootHook.tapPromise(
    'SewingKit.differentialServing',
    differentialServingPlugin,
  );
  rootHook.tapPromise('SewingKit.packages', packagePlugin);

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
