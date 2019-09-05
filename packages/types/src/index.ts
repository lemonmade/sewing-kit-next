import {AsyncSeriesHook, AsyncSeriesWaterfallHook} from 'tapable';
import execa from 'execa';

// ==================================================================
// UI
// ==================================================================

export type Formatter = (
  strings: TemplateStringsArray,
  ...interpolated: Loggable[]
) => string;

export type Loggable = ((format: Formatter) => string) | string;

export enum LogLevel {
  Errors,
  Info,
  Debug,
}

export interface StepRunner {
  readonly exec: typeof execa;
  log(arg: Loggable, level?: LogLevel): void;
}

export interface Step {
  readonly label?: Loggable;
  readonly indefinite?: boolean;
  readonly steps?: readonly Step[];
  skip(skipped: string[]): boolean;
  run?(runner: StepRunner): void | Promise<void>;
}

// ==================================================================
// CORE
// ==================================================================

export enum Env {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
  Test = 'test',
}

export enum PluginTarget {
  Root,
  BuildProject,
  BuildWebApp,
  BuildService,
  BuildPackage,
  TestProject,
}

export const PLUGIN = Symbol('SewingKitPlugin');

export interface Plugin {
  readonly id: string;
  readonly target: PluginTarget;
  readonly [PLUGIN]: true;
  readonly composes: readonly Plugin[];
}

export enum Runtime {
  Node = 'node',
  Browser = 'browser',
  ServiceWorker = 'service-worker',
  WebWorker = 'web-worker',
}

export interface ProjectCreateOptions {
  name: string;
  root: string;
  plugins?: readonly Plugin[];
}

export interface WebAppCoreOptions {}
export interface WebAppCustomOptions {}
export interface WebAppOptions
  extends WebAppCoreOptions,
    Partial<WebAppCustomOptions> {}

export interface WebAppCreateOptions extends ProjectCreateOptions {
  entry: string;
  options?: WebAppCoreOptions & Partial<WebAppCustomOptions>;
  serviceWorker?: string;
}

export interface PackageBinaryCreateOptions {
  readonly name: string;
  readonly root: string;
  readonly aliases?: string[];
}

export interface PackageEntryCustomOptions {}
export interface PackageEntryCoreOptions {}
export interface PackageEntryOptions
  extends PackageEntryCoreOptions,
    Partial<PackageEntryCustomOptions> {}

export interface PackageEntryCreateOptions {
  readonly root: string;
  readonly name?: string;
  readonly runtime?: Runtime;
  readonly options?: PackageEntryOptions;
}

export interface PackageCreateOptions extends ProjectCreateOptions {
  runtime?: Runtime;
  entries: PackageEntryCreateOptions[];
  binaries: PackageBinaryCreateOptions[];
}

export interface ServiceCoreOptions {}
export interface ServiceCustomOptions {}
export interface ServiceOptions
  extends ServiceCoreOptions,
    Partial<ServiceCustomOptions> {}

export interface ServiceCreateOptions extends ProjectCreateOptions {
  entry: string;
  options?: ServiceOptions;
}

// ==================================================================
// BUILD
// ==================================================================

// PACKAGE

export interface BuildPackageOptions {}

export interface BuildPackageConfigurationCustomHooks {}

export interface BuildPackageConfigurationCoreHooks {
  readonly extensions: AsyncSeriesWaterfallHook<string[]>;
}

export interface BuildPackageConfigurationHooks
  extends BuildPackageConfigurationCoreHooks,
    Partial<BuildPackageConfigurationCustomHooks> {}

export interface BuildPackageHooks {
  readonly variants: AsyncSeriesWaterfallHook<Partial<BuildPackageOptions>[]>;

  readonly configure: AsyncSeriesHook<
    BuildPackageConfigurationHooks,
    Partial<BuildPackageOptions>
  >;

  readonly steps: AsyncSeriesWaterfallHook<
    Step[],
    {
      variant: Partial<BuildPackageOptions>;
      config: BuildPackageConfigurationHooks;
    }
  >;
}

// SERVICE

export interface BuildServiceConfigurationCustomHooks {}

export interface BuildServiceConfigurationCoreHooks {
  readonly output: AsyncSeriesWaterfallHook<string>;
  readonly entries: AsyncSeriesWaterfallHook<string[]>;
  readonly extensions: AsyncSeriesWaterfallHook<string[]>;
  readonly filename: AsyncSeriesWaterfallHook<string>;
}

export interface BuildServiceConfigurationHooks
  extends BuildServiceConfigurationCoreHooks,
    Partial<BuildServiceConfigurationCustomHooks> {}

export interface BuildServiceHooks {
  readonly configure: AsyncSeriesHook<BuildServiceConfigurationHooks>;

  readonly steps: AsyncSeriesWaterfallHook<
    Step[],
    {
      config: BuildServiceConfigurationHooks;
    }
  >;
}

// WEB APP

export interface BuildWebAppOptions {}

export interface BuildBrowserConfigurationCoreHooks {
  readonly output: AsyncSeriesWaterfallHook<string>;
  readonly entries: AsyncSeriesWaterfallHook<string[]>;
  readonly extensions: AsyncSeriesWaterfallHook<string[]>;
  readonly filename: AsyncSeriesWaterfallHook<string>;
}

export interface BuildBrowserConfigurationCustomHooks {}

export interface BuildBrowserConfigurationHooks
  extends BuildBrowserConfigurationCoreHooks,
    Partial<BuildBrowserConfigurationCustomHooks> {}

export interface BuildServiceWorkerConfigurationCoreHooks
  extends BuildBrowserConfigurationCoreHooks {}

export interface BuildServiceWorkerConfigurationCustomHooks
  extends BuildBrowserConfigurationCustomHooks {}

export interface BuildServiceWorkerConfigurationHooks
  extends BuildServiceWorkerConfigurationCoreHooks,
    Partial<BuildServiceWorkerConfigurationCustomHooks> {}

export interface BuildWebAppHooks {
  readonly variants: AsyncSeriesWaterfallHook<Partial<BuildWebAppOptions>[]>;

  readonly configure: AsyncSeriesHook<
    BuildBrowserConfigurationHooks | BuildServiceWorkerConfigurationHooks,
    Partial<BuildWebAppOptions>
  >;
  readonly configureBrowser: AsyncSeriesHook<
    BuildBrowserConfigurationHooks,
    Partial<BuildWebAppOptions>
  >;
  readonly configureServiceWorker: AsyncSeriesHook<
    BuildBrowserConfigurationHooks,
    Partial<BuildWebAppOptions>
  >;

  readonly steps: AsyncSeriesWaterfallHook<
    Step[],
    {
      variant: Partial<BuildWebAppOptions>;
      browserConfig: BuildBrowserConfigurationHooks;
      serviceWorkerConfig: BuildServiceWorkerConfigurationHooks;
    }
  >;
}

// ROOT

export interface BuildRootConfigurationCustomHooks {}

export interface BuildRootConfigurationCoreHooks {}

export interface BuildRootConfigurationHooks
  extends BuildRootConfigurationCoreHooks,
    Partial<BuildRootConfigurationCustomHooks> {}

// ==================================================================
// DEV
// ==================================================================

// PACKAGE

export interface DevPackageConfigurationCustomHooks {}
export interface DevPackageConfigurationCoreHooks {}
export interface DevPackageConfigurationHooks
  extends DevPackageConfigurationCoreHooks,
    Partial<DevPackageConfigurationCustomHooks> {}

export interface DevPackageHooks {
  readonly configure: AsyncSeriesHook<DevPackageConfigurationHooks>;
  readonly steps: AsyncSeriesWaterfallHook<
    Step[],
    {
      config: DevPackageConfigurationHooks;
      buildConfig: BuildPackageConfigurationHooks;
    }
  >;
}

// PACKAGE

export interface DevServiceConfigurationCustomHooks {}

export interface DevServiceConfigurationCoreHooks {
  readonly ip: AsyncSeriesWaterfallHook<string | undefined>;
  readonly port: AsyncSeriesWaterfallHook<number | undefined>;
}

export interface DevServiceConfigurationHooks
  extends DevServiceConfigurationCoreHooks,
    Partial<DevServiceConfigurationCustomHooks> {}

export interface DevServiceHooks {
  readonly configure: AsyncSeriesHook<DevServiceConfigurationHooks>;
  readonly steps: AsyncSeriesWaterfallHook<
    Step[],
    {
      config: DevServiceConfigurationHooks;
      buildConfig: BuildServiceConfigurationHooks;
    }
  >;
}

// WEB APP

export interface DevWebAppConfigurationCoreHooks {}
export interface DevWebAppConfigurationCustomHooks {}
export interface DevWebAppConfigurationHooks
  extends DevWebAppConfigurationCoreHooks,
    Partial<DevWebAppConfigurationCustomHooks> {}

export interface DevWebAppHooks {
  readonly configure: AsyncSeriesHook<DevWebAppConfigurationHooks>;
  readonly steps: AsyncSeriesWaterfallHook<
    Step[],
    {
      config: DevPackageConfigurationHooks;
      buildBrowserConfig: BuildBrowserConfigurationHooks;
      buildServiceWorkerConfig: BuildServiceWorkerConfigurationHooks;
    }
  >;
}

// ROOT

export interface DevRootConfigurationCustomHooks {}

export interface DevRootConfigurationCoreHooks {}

export interface DevRootConfigurationHooks
  extends DevRootConfigurationCoreHooks,
    Partial<DevRootConfigurationCustomHooks> {}

// ==================================================================
// LINT
// ==================================================================

// TASK

export interface LintRootConfigurationCustomHooks {}
export interface LintRootConfigurationCoreHooks {}

export interface LintRootConfigurationHooks
  extends LintRootConfigurationCoreHooks,
    Partial<LintRootConfigurationCustomHooks> {}

// ==================================================================
// TEST
// ==================================================================

// PROJECT

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

// ROOT

export interface TestRootConfigurationCustomHooks {}

interface TestRootConfigurationCoreHooks {}

export interface TestRootConfigurationHooks
  extends TestRootConfigurationCoreHooks,
    Partial<TestRootConfigurationCustomHooks> {}

// ==================================================================
// TYPE CHECK
// ==================================================================

// ROOT

export interface TypeCheckRootConfigurationCustomHooks {}
export interface TypeCheckRootConfigurationCoreHooks {}

export interface TypeCheckRootConfigurationHooks
  extends TypeCheckRootConfigurationCoreHooks,
    Partial<TypeCheckRootConfigurationCustomHooks> {}
