import {resolve} from 'path';
import webpack from 'webpack';
import {AsyncSeriesHook} from 'tapable';

import {Work, Configuration, Build} from './concepts';

export interface Options {
  root: string;
  plugins?: ((work: Work) => void)[];
}

export async function run({root, plugins = []}: Options) {
  const work = new Work();
  const configuration = new Configuration();
  const build = new Build(configuration);

  const rootHook = new AsyncSeriesHook(['work']);

  rootHook.tapPromise(
    'SewingKit.web',
    makePlugin(() => import('./plugins/web')),
  );

  rootHook.tapPromise(
    'SewingKit.typescript',
    makePlugin(() => import('./plugins/typescript')),
  );

  for (const plugin of plugins) {
    rootHook.tap('custom', plugin);
  }

  await rootHook.promise(work);

  work.hooks.configure.call(configuration);
  work.hooks.build.call(build);

  const rules = await build.hooks.rules.promise([]);
  const extensions = await build.hooks.extensions.promise([
    '.js',
    '.jsx',
    '.mjs',
    '.json',
  ]);

  const config = await build.hooks.config.promise({
    mode: 'development',
    entry: [resolve(root, 'client')],
    output: {
      path: resolve(root, 'build', 'client'),
    },
    resolve: {extensions},
    module: {rules},
  });

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
