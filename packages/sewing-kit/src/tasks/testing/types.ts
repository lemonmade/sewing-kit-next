import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Package, Workspace} from '../../workspace';
import {BabelConfig} from '../../types';

interface TransformOptions {
  babelTransform: string;
}

export interface TestTaskOptions {
  pre?: boolean;
  watch?: boolean;
  debug?: boolean;
  coverage?: boolean;
  testPattern?: string;
  testNamePattern?: string;
  maxWorkers?: number;
  updateSnapshot?: boolean;
}

interface JestFlags {
  config?: string;
  watch?: boolean;
  watchAll?: boolean;
  testNamePattern?: string;
  testPathPattern?: string;
  runInBand?: boolean;
  forceExit?: boolean;
  maxWorkers?: number;
  onlyChanged?: boolean;
  coverage?: boolean;
  updateSnapshot?: boolean;
}

export interface ProjectConfigurationHooks {
  readonly babel: AsyncSeriesWaterfallHook<BabelConfig>;
  readonly extensions: AsyncSeriesWaterfallHook<string[]>;
  readonly environment: AsyncSeriesWaterfallHook<string>;
  readonly moduleMapper: AsyncSeriesWaterfallHook<{[key: string]: string}>;

  readonly setupEnv: AsyncSeriesWaterfallHook<string[]>;
  readonly setupTests: AsyncSeriesWaterfallHook<string[]>;

  readonly jestTransforms: AsyncSeriesWaterfallHook<
    {[key: string]: string},
    TransformOptions
  >;

  readonly jestConfig: AsyncSeriesWaterfallHook<jest.InitialOptions>;
}

export interface RootConfigurationHooks {
  readonly setupEnv: AsyncSeriesWaterfallHook<string[]>;
  readonly setupTests: AsyncSeriesWaterfallHook<string[]>;
  readonly watchIgnore: AsyncSeriesWaterfallHook<string[]>;

  readonly jestConfig: AsyncSeriesWaterfallHook<jest.InitialOptions>;
  readonly jestWatchPlugins: AsyncSeriesWaterfallHook<string[]>;
  readonly jestFlags: AsyncSeriesWaterfallHook<JestFlags>;
}

export interface TestTaskHooks {
  readonly configureRoot: AsyncSeriesHook<RootConfigurationHooks>;
  readonly configureProject: AsyncSeriesHook<{
    project: Package;
    hooks: ProjectConfigurationHooks;
  }>;
  readonly configurePackage: AsyncSeriesHook<{
    pkg: Package;
    hooks: ProjectConfigurationHooks;
  }>;
}

export interface TestTask {
  readonly hooks: TestTaskHooks;
  readonly workspace: Workspace;
  readonly options: TestTaskOptions;
}
