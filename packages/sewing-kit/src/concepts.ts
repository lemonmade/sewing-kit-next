import {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncSeriesWaterfallHook, SyncHook} from 'tapable';

export class BrowserApp {}

export class Build {
  readonly hooks = {
    rules: new AsyncSeriesWaterfallHook<any[]>(['rules']),
    extensions: new AsyncSeriesWaterfallHook<string[]>(['extensions']),
    config: new AsyncSeriesWaterfallHook<WebpackConfiguration>(['config']),
  };

  constructor(public readonly configuration: Configuration) {}
}

export interface BabelConfig {
  presets: any[];
}

export class Configuration {
  readonly hooks = {
    babel: new AsyncSeriesWaterfallHook<BabelConfig>(['config']),
  };
}

export class Work {
  readonly hooks = {
    build: new SyncHook<Build>(['build']),
    configure: new SyncHook<Configuration>(['configuration']),
  };
}
