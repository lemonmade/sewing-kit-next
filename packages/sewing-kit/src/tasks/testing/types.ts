import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Step} from '../../runner';
import {Package, Workspace, WebApp} from '../../workspace';

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

export interface ProjectConfigurationCustomHooks {}

interface ProjectConfigurationCoreHooks {}

export interface ProjectConfigurationHooks
  extends ProjectConfigurationCoreHooks,
    Partial<ProjectConfigurationCustomHooks> {}

// WEB APP

export interface WebAppTestConfigurationCustomHooks {}

interface WebAppTestConfigurationCoreHooks {}

export interface WebAppTestConfigurationHooks
  extends ProjectConfigurationHooks,
    WebAppTestConfigurationCoreHooks,
    Partial<WebAppTestConfigurationCoreHooks> {}

export interface WebAppTestHooks {
  configure: AsyncSeriesHook<WebAppTestConfigurationHooks>;
}

// PACKAGE

export interface PackageTestConfigurationCustomHooks {}

interface PackageTestConfigurationCoreHooks {}

export interface PackageTestConfigurationHooks
  extends ProjectConfigurationHooks,
    PackageTestConfigurationCoreHooks,
    Partial<PackageTestConfigurationCoreHooks> {}

export interface PackageTestHooks {
  configure: AsyncSeriesHook<PackageTestConfigurationHooks>;
}

// TASK

export interface RootConfigurationCustomHooks {}

interface RootConfigurationCoreHooks {}

export interface RootConfigurationHooks
  extends RootConfigurationCoreHooks,
    Partial<RootConfigurationCustomHooks> {}

export interface TestTaskHooks {
  readonly project: AsyncSeriesHook<
    | {
        project: Package;
        hooks: PackageTestHooks;
      }
    | {project: WebApp; hooks: WebAppTestHooks}
  >;
  readonly package: AsyncSeriesHook<{
    pkg: Package;
    hooks: PackageTestHooks;
  }>;
  readonly webApp: AsyncSeriesHook<{webApp: WebApp; hooks: WebAppTestHooks}>;

  readonly preSteps: AsyncSeriesWaterfallHook<Step[]>;
  readonly postSteps: AsyncSeriesWaterfallHook<Step[]>;

  readonly configure: AsyncSeriesHook<RootConfigurationHooks>;
  readonly steps: AsyncSeriesWaterfallHook<Step[]>;
}

export interface TestTask {
  readonly hooks: TestTaskHooks;
  readonly workspace: Workspace;
  readonly options: TestTaskOptions;
}
