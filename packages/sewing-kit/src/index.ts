import 'core-js/features/array/flat';
import 'core-js/features/array/flat-map';

import {exec} from 'child_process';
import webpack, {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncParallelHook} from 'tapable';

import {Work} from './work';
import {
  BuildTask,
  Env,
  Configuration,
  VariantBuilder,
  BrowserBuildVariants,
  PackageBuildVariants,
  WebAppBuild,
  PackageBuild,
} from './build';
import {WorkspaceDiscovery} from './discovery';

const typescriptPlugin = makePlugin(() => import('./plugins/typescript'));
const browserAppPlugin = makePlugin(() => import('./plugins/browser-app'));
const differentialServingPlugin = makePlugin(() =>
  import('./plugins/differential-serving'),
);
const javascriptPlugin = makePlugin(() => import('./plugins/javascript'));
const jsonPlugin = makePlugin(() => import('./plugins/json'));
const packagePlugin = makePlugin(() => import('./plugins/package'));
const packageCommonJs = makePlugin(() => import('./plugins/package-commonjs'));
const packageEsmodules = makePlugin(() => import('./plugins/package-esmodules'));
const packageEsnext = makePlugin(() => import('./plugins/package-esnext'));

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

  const webAppBuilds = (await Promise.all(
    workspace.apps.map(async (app) => {
      const variants = new VariantBuilder<BrowserBuildVariants>();
      await build.variants.apps.promise(variants, app);
      return variants.all.map<WebAppBuild>((variant) => ({app, variant}));
    }),
  )).flat();

  const packageBuilds = (await Promise.all(
    workspace.packages.map(async (pkg) => {
      const variants = new VariantBuilder<PackageBuildVariants>();
      await build.variants.packages.promise(variants, pkg);
      return variants.all.map<PackageBuild>((variant) => ({pkg, variant}));
    }),
  )).flat();

  const babelConfig = workspace.sewingKit.configPath(
    'build/packages/babel.esnext.js',
  );

  await workspace.sewingKit.write(
    babelConfig,
    `module.exports = ${JSON.stringify({
      presets: [
        [
          require.resolve('babel-preset-shopify'),
          {typescript: true, modules: false},
        ],
      ],
    })};`,
  );

  await Promise.all([
    ...webAppBuilds.map(async (webAppBuild) => {
      const {app} = webAppBuild;

      const configuration = new Configuration();
      await build.configure.common.promise(configuration);
      await build.configure.browser.promise(configuration, webAppBuild);

      const rules = await configuration.webpackRules.promise([]);
      const extensions = await configuration.extensions.promise([]);
      const outputPath = await configuration.output.promise(app.fs.buildPath());
      const filename = await configuration.filename.promise('[name].js');

      const config = await configuration.webpackConfig.promise({
        entry: await configuration.entries.promise([app.entry]),
        mode: toMode(env.simulate),
        resolve: {extensions},
        module: {rules},
        output: {
          path: outputPath,
          filename,
        },
      });

      await buildWebpack(config);
    }),
    ...packageBuilds.map(async (packageBuild) => {
      const {pkg} = packageBuild;

      const configuration = new Configuration();
      await build.configure.common.promise(configuration);
      await build.configure.package.promise(configuration, packageBuild);

      const extensions = await configuration.extensions.promise([]);
      const outputPath = await configuration.output.promise(pkg.fs.buildPath());

      return new Promise((resolve, reject) => {
        exec(
          `node_modules/.bin/babel ${
            pkg.entries[0].root
          } --out-dir ${JSON.stringify(
            outputPath,
          )} --verbose --no-babelrc --extensions ${JSON.stringify(
            extensions.join(','),
          )} --config-file ${JSON.stringify(babelConfig)}`,
          (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          },
        );
      });
    }),
  ]);
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
  rootHook.tapPromise('SewingKit.packageCommonJs', packageCommonJs);
  rootHook.tapPromise('SewingKit.packageEsmodules', packageEsmodules);
  rootHook.tapPromise('SewingKit.packageEsnext', packageEsnext);

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
