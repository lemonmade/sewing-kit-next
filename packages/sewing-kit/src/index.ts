import webpack, {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncParallelHook} from 'tapable';

import {Work} from './work';
import {BuildTask, Env, BrowserWebpackBuild} from './build';
import {WorkspaceDiscovery} from './discovery';

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
  work.tasks.discovery.call(discovery);
  const workspace = await discovery.discover();

  const env = {actual: Env.Development, simulate: Env.Development};

  const build = new BuildTask();
  work.tasks.build.call(build, env, workspace);

  const browserBuilds = await build.hooks.browserApps.promise(
    [...workspace.browserApps].map((app) => ({
      app,
      variants: [],
    })),
  );

  const browserWebpackBuilds = browserBuilds.map(
    ({app, variants}) => new BrowserWebpackBuild(app, variants),
  );

  await Promise.all(
    browserWebpackBuilds.map((webpackBuild) =>
      build.webpack.browser.promise(webpackBuild),
    ),
  );

  await Promise.all(
    browserWebpackBuilds.map(async (browserBuild) => {
      const rules = await browserBuild.hooks.rules.promise([]);
      const extensions = await browserBuild.hooks.extensions.promise([]);

      const config = await browserBuild.hooks.config.promise({
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
