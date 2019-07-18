import {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncSeriesWaterfallHook, AsyncParallelHook} from 'tapable';
import {WebApp} from './concepts';

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
  readonly extensions = new AsyncSeriesWaterfallHook<string[]>(['extensions']);

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
      'browserApp',
    ]),
    // serviceWorker: new AsyncParallelHook<ServiceWorkerWebpackBuild>([
    //   'serviceWorker',
    // ]),
  };

  readonly discovery = {
    apps: new AsyncSeriesWaterfallHook<WebAppBuild[]>(['browserApps']),
    // services: new AsyncSeriesWaterfallHook(['services']),
  };

  constructor() {}
}

type VariantValues<T> = {
  [K in keyof T]: {name: K; value: T[K]};
}[keyof T][];

export interface BrowserBuildVariants {}

export interface WebAppBuild {
  readonly app: WebApp;
  readonly variants: VariantValues<BrowserBuildVariants>;
}

// export class ServiceWorkerWebpackBuild {
//   readonly configuration = new BuildConfiguration();
//   readonly hooks = {
//     rules: new AsyncSeriesWaterfallHook<any[]>(['rules']),
//     extensions: new AsyncSeriesWaterfallHook<string[]>(['extensions']),
//     config: new AsyncSeriesWaterfallHook<WebpackConfiguration>(['config']),
//   };
// }
