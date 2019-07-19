import webpack, {Configuration as WebpackConfiguration} from 'webpack';
import {
  AsyncSeriesWaterfallHook,
  AsyncParallelHook,
  AsyncSeriesHook,
} from 'tapable';

import {Env} from '../../types';
import {WebApp, Package, Workspace} from '../../workspace';

import {
  Configuration,
  Environment,
  WebAppBuild,
  PackageBuild,
  BrowserBuildVariants,
  PackageBuildVariants,
} from './types';
import {VariantBuilder, Variant} from './variants';

export interface BuildStep {
  run(): Promise<void>;
}

export class BuildSteps<T> {
  readonly beforeAll = new AsyncSeriesWaterfallHook<BuildStep[], T[]>([
    'steps',
    'builds',
  ]);
  readonly beforeEach = new AsyncSeriesWaterfallHook<BuildStep[], T>([
    'steps',
    'build',
  ]);
  readonly each = new AsyncSeriesWaterfallHook<BuildStep[], T>([
    'steps',
    'build',
  ]);
  readonly afterEach = new AsyncSeriesWaterfallHook<BuildStep[], T>([
    'steps',
    'build',
  ]);
  readonly afterAll = new AsyncSeriesWaterfallHook<BuildStep[], T[]>([
    'steps',
    'builds',
  ]);

  async run(builds: T[]) {
    const [beforeAll, afterAll] = await Promise.all([
      this.beforeAll.promise([], builds),
      this.afterAll.promise([], builds),
    ]);

    const each = await Promise.all(
      builds.map(async (build) => {
        const [before, during, after] = await Promise.all([
          this.beforeEach.promise([], build),
          this.each.promise([], build),
          this.afterEach.promise([], build),
        ]);

        return [...before, ...during, ...after];
      }),
    );

    return [...beforeAll, ...each.flat(), ...afterAll];
  }
}

export class BuildTask {
  readonly configure = {
    common: new AsyncParallelHook<Configuration>(['configuration']),
    browser: new AsyncParallelHook<
      Configuration,
      WebApp,
      Variant<BrowserBuildVariants>
    >(['configuration', 'app', 'variant']),
    package: new AsyncParallelHook<
      Configuration,
      Package,
      Variant<PackageBuildVariants>
    >(['configuration', 'pkg', 'variant']),
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

  readonly steps = {
    app: new BuildSteps<PackageBuild>(),
    package: new BuildSteps<PackageBuild>(),
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

        return Promise.all(
          variants.all.map<Promise<WebAppBuild>>(async (variant) => {
            const config = new Configuration();
            await this.configure.common.promise(config);
            await this.configure.browser.promise(config, app, variant);
            return {app, variant, config};
          }),
        );
      }),
    )).flat();

    const packageBuilds = (await Promise.all(
      this.workspace.packages.map(async (pkg) => {
        const variants = new VariantBuilder<PackageBuildVariants>();
        await this.variants.packages.promise(variants, pkg);

        return Promise.all(
          variants.all.map<Promise<PackageBuild>>(async (variant) => {
            const config = new Configuration();
            await this.configure.common.promise(config);
            await this.configure.package.promise(config, pkg, variant);
            return {pkg, variant, config};
          }),
        );
      }),
    )).flat();

    const packageSteps = await this.steps.package.run(packageBuilds);

    await Promise.all([
      ...webAppBuilds.map(async (webAppBuild) => {
        const {app, config} = webAppBuild;

        const rules = await config.webpackRules.promise([]);
        const extensions = await config.extensions.promise([]);
        const outputPath = await config.output.promise(
          this.workspace.fs.buildPath(),
        );
        const filename = await config.filename.promise('[name].js');

        const webpackConfig = await config.webpackConfig.promise({
          entry: await config.entries.promise([app.entry]),
          mode: toMode(this.env.simulate),
          resolve: {extensions},
          module: {rules},
          output: {
            path: outputPath,
            filename,
          },
        });

        await buildWebpack(webpackConfig);
      }),
      ...packageSteps.map((step) => step.run()),
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
