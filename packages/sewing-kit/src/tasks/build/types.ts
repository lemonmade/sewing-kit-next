import {AsyncSeriesWaterfallHook} from 'tapable';
import {Configuration as WebpackConfiguration} from 'webpack';

import {WebApp, Package} from '../../workspace';
import {Env} from '../../types';
import {Variant} from './variants';

export interface Environment {
  readonly actual: Env;
  readonly simulate: Env;
}

export interface BrowserBuildVariants {}

export interface WebAppBuild {
  readonly app: WebApp;
  readonly config: Configuration;
  readonly variant: Variant<BrowserBuildVariants>;
}

export interface PackageBuildVariants {}

export interface PackageBuild {
  readonly pkg: Package;
  readonly config: Configuration;
  readonly variant: Variant<PackageBuildVariants>;
}

export interface BabelConfig {
  presets: (string | [string, object])[];
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
