import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';

import {Step} from '../../runner';
import {Package, WebApp, Workspace} from '../../workspace';
import {Env} from '../../types';

// PACKAGE

export interface PackageBuildOptions {}

export interface PackageBuildConfigurationCustomHooks {}

export interface PackageBuildConfigurationCoreHooks {
  readonly extensions: AsyncSeriesWaterfallHook<string[]>;
  readonly output: AsyncSeriesWaterfallHook<string>;
}

export interface PackageBuildConfigurationHooks
  extends PackageBuildConfigurationCoreHooks,
    Partial<PackageBuildConfigurationCustomHooks> {}

export interface PackageBuildHooks {
  readonly variants: AsyncSeriesWaterfallHook<Partial<PackageBuildOptions>[]>;

  readonly configure: AsyncSeriesHook<
    PackageBuildConfigurationHooks,
    Partial<PackageBuildOptions>
  >;

  readonly steps: AsyncSeriesWaterfallHook<
    Step[],
    {
      variant: Partial<PackageBuildOptions>;
      config: PackageBuildConfigurationHooks;
    }
  >;
}

// WEB APP

export interface WebAppBuildOptions {}

export interface BrowserBuildConfigurationCoreHooks {
  readonly output: AsyncSeriesWaterfallHook<string>;
  readonly entries: AsyncSeriesWaterfallHook<string[]>;
  readonly extensions: AsyncSeriesWaterfallHook<string[]>;
  readonly filename: AsyncSeriesWaterfallHook<string>;
}

export interface BrowserBuildConfigurationCustomHooks {}

export interface BrowserBuildConfigurationHooks
  extends BrowserBuildConfigurationCoreHooks,
    Partial<BrowserBuildConfigurationCustomHooks> {}

export interface ServiceWorkerBuildConfigurationCoreHooks
  extends BrowserBuildConfigurationCoreHooks {}

export interface ServiceWorkerBuildConfigurationCustomHooks
  extends BrowserBuildConfigurationCustomHooks {}

export interface ServiceWorkerBuildConfigurationHooks
  extends ServiceWorkerBuildConfigurationCoreHooks,
    Partial<ServiceWorkerBuildConfigurationCustomHooks> {}

export interface WebAppBuildHooks {
  readonly variants: AsyncSeriesWaterfallHook<Partial<WebAppBuildOptions>[]>;

  readonly configure: AsyncSeriesHook<
    BrowserBuildConfigurationHooks | ServiceWorkerBuildConfigurationHooks,
    Partial<WebAppBuildOptions>
  >;
  readonly configureBrowser: AsyncSeriesHook<
    BrowserBuildConfigurationHooks,
    Partial<WebAppBuildOptions>
  >;
  readonly configureServiceWorker: AsyncSeriesHook<
    BrowserBuildConfigurationHooks,
    Partial<WebAppBuildOptions>
  >;

  readonly steps: AsyncSeriesWaterfallHook<
    Step[],
    {
      variant: Partial<WebAppBuildOptions>;
      browserConfig: BrowserBuildConfigurationHooks;
      serviceWorkerConfig: ServiceWorkerBuildConfigurationHooks;
    }
  >;
}

// TASK

export interface BuildTaskOptions {
  readonly env: Env;
  readonly simulateEnv: Env;
}

export interface BuildTaskHooks {
  readonly pre: AsyncSeriesWaterfallHook<Step[]>;

  readonly project: AsyncSeriesHook<
    | {
        project: WebApp;
        hooks: WebAppBuildHooks;
      }
    | {project: Package; hooks: PackageBuildHooks}
  >;
  readonly package: AsyncSeriesHook<{pkg: Package; hooks: PackageBuildHooks}>;
  readonly webApp: AsyncSeriesHook<{webApp: WebApp; hooks: WebAppBuildHooks}>;

  readonly post: AsyncSeriesWaterfallHook<Step[]>;
}

export interface BuildTask {
  readonly hooks: BuildTaskHooks;
  readonly options: BuildTaskOptions;
  readonly workspace: Workspace;
}
