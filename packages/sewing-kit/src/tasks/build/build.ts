import {exec} from 'child_process';
import webpack, {Configuration as WebpackConfiguration} from 'webpack';
import {
  AsyncSeriesWaterfallHook,
  AsyncParallelHook,
  AsyncSeriesHook,
} from 'tapable';

import {Env} from '../../types';
import {WebApp, Package, Workspace} from '../../workspace';

import {
  Environment,
  WebAppBuild,
  PackageBuild,
  BrowserBuildVariants,
  PackageBuildVariants,
} from './types';
import {VariantBuilder} from './variants';

export interface BabelConfig {
  presets: any[];
}

export class Configuration {
  readonly babel = new AsyncSeriesWaterfallHook<BabelConfig>(['babelConfig']);
  readonly output = new AsyncSeriesWaterfallHook<string>(['output']);
  readonly entries = new AsyncSeriesWaterfallHook<string[]>(['entries']);
  readonly extensions = new AsyncSeriesWaterfallHook<string[]>(['extensions']);
  readonly filename = new AsyncSeriesWaterfallHook<string>(['filename']);

  readonly webpackRules = new AsyncSeriesWaterfallHook<any[]>(['rules']);
  readonly webpackConfig = new AsyncSeriesWaterfallHook<WebpackConfiguration>([
    'config',
  ]);
}

export class BuildTask {
  readonly configure = {
    common: new AsyncParallelHook<Configuration>(['configuration']),
    browser: new AsyncParallelHook<Configuration, WebAppBuild>([
      'configuration',
      'webAppBuild',
    ]),
    package: new AsyncParallelHook<Configuration, PackageBuild>([
      'configuration',
      'packageBuild',
    ]),
  };

  readonly variants = {
    apps: new AsyncSeriesHook<VariantBuilder<BrowserBuildVariants>, WebApp>([
      'variants',
      'app',
    ]),
    packages: new AsyncSeriesHook<
      VariantBuilder<PackageBuildVariants>,
      Package
    >(['variants', 'pkg']),
  };

  constructor(
    public readonly env: Environment,
    private readonly workspace: Workspace,
  ) {}

  async run() {
    const webAppBuilds = (await Promise.all(
      this.workspace.apps.map(async (app) => {
        const variants = new VariantBuilder<BrowserBuildVariants>();
        await this.variants.apps.promise(variants, app);
        return variants.all.map<WebAppBuild>((variant) => ({app, variant}));
      }),
    )).flat();

    const packageBuilds = (await Promise.all(
      this.workspace.packages.map(async (pkg) => {
        const variants = new VariantBuilder<PackageBuildVariants>();
        await this.variants.packages.promise(variants, pkg);
        return variants.all.map<PackageBuild>((variant) => ({pkg, variant}));
      }),
    )).flat();

    const babelConfig = this.workspace.sewingKit.configPath(
      'build/packages/babel.esnext.js',
    );

    await this.workspace.sewingKit.write(
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
        await this.configure.common.promise(configuration);
        await this.configure.browser.promise(configuration, webAppBuild);

        const rules = await configuration.webpackRules.promise([]);
        const extensions = await configuration.extensions.promise([]);
        const outputPath = await configuration.output.promise(
          app.fs.buildPath(),
        );
        const filename = await configuration.filename.promise('[name].js');

        const config = await configuration.webpackConfig.promise({
          entry: await configuration.entries.promise([app.entry]),
          mode: toMode(this.env.simulate),
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
        await this.configure.common.promise(configuration);
        await this.configure.package.promise(configuration, packageBuild);

        const extensions = await configuration.extensions.promise([]);
        const outputPath = await configuration.output.promise(
          pkg.fs.buildPath(),
        );

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

function buildWebpack(config: WebpackConfiguration) {
  const compiler = webpack(config);

  return new Promise((resolve) => {
    compiler.run((_error, _stats) => {
      resolve();
    });
  });
}
