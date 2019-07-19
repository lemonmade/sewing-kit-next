import {Configuration as WebpackConfiguration} from 'webpack';
import {
  AsyncSeriesWaterfallHook,
  AsyncParallelHook,
  AsyncSeriesHook,
} from 'tapable';
import {WebApp, Package} from './concepts';

export enum Env {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
  Test = 'test',
}

export interface Environment {
  readonly actual: Env;
  readonly simulate: Env;
}

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
    // serviceWorker: new AsyncParallelHook<ServiceWorkerWebpackBuild>([
    //   'serviceWorker',
    // ]),
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
    // services: new AsyncSeriesWaterfallHook(['services']),
  };

  constructor() {}
}

type VariantTuples<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T];

type VariantTupleArrays<T> = {
  [K in keyof T]: [K, T[K][]];
}[keyof T];

export class Variant<T> {
  private readonly map: Map<keyof T, T[keyof T]>;

  constructor(tuples: VariantTuples<T>[]) {
    this.map = new Map(tuples);
  }

  get<K extends keyof T>(key: K): T[K] | false {
    return (this.map.get(key) || false) as any;
  }
}

export class VariantBuilder<T> {
  get all() {
    type Tuple = VariantTuples<T>;

    const {additive, multiplicative} = this;
    const tupleGroups: Tuple[][] =
      additive.length > 0 ? additive.map((add) => [add]) : [[]];

    return multiplicative
      .reduce((all, [name, values]) => {
        return values.flatMap((value) =>
          all.map((tupleGroup) => [...tupleGroup, [name, value]]),
        );
      }, tupleGroups)
      .map((tupleGroup) => new Variant(tupleGroup));
  }

  private readonly additive: VariantTuples<T>[] = [];
  private readonly multiplicative: VariantTupleArrays<T>[] = [];

  add<K extends keyof T>(
    ...args: T[K] extends boolean ? [K, T[K]?] : [K, T[K][]]
  ) {
    const [name, values = true] = args;

    if (typeof values === 'boolean') {
      this.additive.push([name, values] as any);
    } else {
      this.multiplicative.push([name, values]);
    }
  }
}

export interface BrowserBuildVariants {}

export interface WebAppBuild {
  readonly app: WebApp;
  readonly variant: Variant<BrowserBuildVariants>;
}

export interface PackageBuildVariants {}

export interface PackageBuild {
  readonly pkg: Package;
  readonly variant: Variant<PackageBuildVariants>;
}

// export class ServiceWorkerWebpackBuild {
//   readonly configuration = new BuildConfiguration();
//   readonly hooks = {
//     rules: new AsyncSeriesWaterfallHook<any[]>(['rules']),
//     extensions: new AsyncSeriesWaterfallHook<string[]>(['extensions']),
//     config: new AsyncSeriesWaterfallHook<WebpackConfiguration>(['config']),
//   };
// }
