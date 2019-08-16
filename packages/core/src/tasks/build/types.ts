import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Step} from '@sewing-kit/ui';

import {Package, WebApp, Workspace} from '../../workspace';
import {Env} from '../../types';

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

export interface ServiceWorkerBuildConfigurationCoreHooks
  extends BuildBrowserConfigurationCoreHooks {}

export interface ServiceWorkerBuildConfigurationCustomHooks
  extends BuildBrowserConfigurationCustomHooks {}

export interface ServiceWorkerBuildConfigurationHooks
  extends ServiceWorkerBuildConfigurationCoreHooks,
    Partial<ServiceWorkerBuildConfigurationCustomHooks> {}

export interface BuildWebAppHooks {
  readonly variants: AsyncSeriesWaterfallHook<Partial<BuildWebAppOptions>[]>;

  readonly configure: AsyncSeriesHook<
    BuildBrowserConfigurationHooks | ServiceWorkerBuildConfigurationHooks,
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
      serviceWorkerConfig: ServiceWorkerBuildConfigurationHooks;
    }
  >;
}

// ROOT

export interface BuildRootConfigurationCustomHooks {}

export interface BuildRootConfigurationCoreHooks {}

export interface BuildRootConfigurationHooks
  extends BuildRootConfigurationCoreHooks,
    Partial<BuildRootConfigurationCustomHooks> {}

// TASK

export interface BuildTaskOptions {
  readonly env: Env;
  readonly simulateEnv: Env;
}

interface BuildStepDetails {
  readonly configuration: BuildRootConfigurationHooks;
}

export interface BuildTaskHooks {
  readonly configure: AsyncSeriesHook<BuildRootConfigurationHooks>;

  readonly project: AsyncSeriesHook<
    | {
        project: WebApp;
        hooks: BuildWebAppHooks;
      }
    | {project: Package; hooks: BuildPackageHooks}
  >;
  readonly package: AsyncSeriesHook<{pkg: Package; hooks: BuildPackageHooks}>;
  readonly webApp: AsyncSeriesHook<{webApp: WebApp; hooks: BuildWebAppHooks}>;

  readonly pre: AsyncSeriesWaterfallHook<Step[], BuildStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], BuildStepDetails>;
}

export interface BuildTask {
  readonly hooks: BuildTaskHooks;
  readonly options: BuildTaskOptions;
  readonly workspace: Workspace;
}
