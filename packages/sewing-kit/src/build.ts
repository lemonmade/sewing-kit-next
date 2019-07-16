import {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncSeriesWaterfallHook} from 'tapable';
import {BuildTarget} from './concepts';

export class Build {
  readonly configuration = new BuildConfiguration();
  readonly hooks = {
    rules: new AsyncSeriesWaterfallHook<any[], BuildTarget>([
      'rules',
      'target',
    ]),
    extensions: new AsyncSeriesWaterfallHook<string[], BuildTarget>([
      'extensions',
      'target',
    ]),
    config: new AsyncSeriesWaterfallHook<WebpackConfiguration, BuildTarget>([
      'config',
      'target',
    ]),
  };
}

export interface BabelConfig {
  presets: any[];
}

export class BuildConfiguration {
  readonly hooks = {
    babel: new AsyncSeriesWaterfallHook<BabelConfig, BuildTarget>([
      'config',
      'target',
    ]),
  };
}
