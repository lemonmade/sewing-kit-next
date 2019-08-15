import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Step} from '@sewing-kit/ui';
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

export interface TestProjectConfigurationCustomHooks {}

interface TestProjectConfigurationCoreHooks {}

export interface TestProjectConfigurationHooks
  extends TestProjectConfigurationCoreHooks,
    Partial<TestProjectConfigurationCustomHooks> {}

// WEB APP

export interface TestWebAppConfigurationCustomHooks {}

interface TestWebAppConfigurationCoreHooks {}

export interface TestWebAppConfigurationHooks
  extends TestProjectConfigurationHooks,
    TestWebAppConfigurationCoreHooks,
    Partial<TestWebAppConfigurationCoreHooks> {}

export interface TestWebAppHooks {
  configure: AsyncSeriesHook<TestWebAppConfigurationHooks>;
}

// PACKAGE

export interface TestPackageConfigurationCustomHooks {}

interface TestPackageConfigurationCoreHooks {}

export interface TestPackageConfigurationHooks
  extends TestProjectConfigurationHooks,
    TestPackageConfigurationCoreHooks,
    Partial<TestPackageConfigurationCoreHooks> {}

export interface TestPackageHooks {
  configure: AsyncSeriesHook<TestPackageConfigurationHooks>;
}

// TASK

export interface TestRootConfigurationCustomHooks {}

interface TestRootConfigurationCoreHooks {}

export interface TestRootConfigurationHooks
  extends TestRootConfigurationCoreHooks,
    Partial<TestRootConfigurationCustomHooks> {}

interface TestStepDetails {
  configuration: TestRootConfigurationHooks;
}

export interface TestTaskHooks {
  readonly project: AsyncSeriesHook<
    | {
        project: Package;
        hooks: TestPackageHooks;
      }
    | {project: WebApp; hooks: TestWebAppHooks}
  >;
  readonly package: AsyncSeriesHook<{
    pkg: Package;
    hooks: TestPackageHooks;
  }>;
  readonly webApp: AsyncSeriesHook<{webApp: WebApp; hooks: TestWebAppHooks}>;

  readonly configure: AsyncSeriesHook<TestRootConfigurationHooks>;

  readonly pre: AsyncSeriesWaterfallHook<Step[], TestStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], TestStepDetails>;
  readonly steps: AsyncSeriesWaterfallHook<Step[], TestStepDetails>;
}

export interface TestTask {
  readonly hooks: TestTaskHooks;
  readonly workspace: Workspace;
  readonly options: TestTaskOptions;
}
