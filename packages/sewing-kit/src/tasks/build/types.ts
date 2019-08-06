import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Configuration as WebpackConfiguration} from 'webpack';

import {Step} from '../../runner';
import {Package, WebApp, Workspace} from '../../workspace';
import {Env, BabelConfig} from '../../types';

// PACKAGE

export interface PackageBuildOptions {}

export interface PackageBuildConfigurationHooks {
  readonly babel: AsyncSeriesWaterfallHook<BabelConfig>;
  readonly extensions: AsyncSeriesWaterfallHook<string[]>;
  readonly output: AsyncSeriesWaterfallHook<string>;
}

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

export interface BrowserBuildConfigurationHooks {
  readonly babel: AsyncSeriesWaterfallHook<BabelConfig>;
  readonly output: AsyncSeriesWaterfallHook<string>;
  readonly entries: AsyncSeriesWaterfallHook<string[]>;
  readonly extensions: AsyncSeriesWaterfallHook<string[]>;
  readonly filename: AsyncSeriesWaterfallHook<string>;
  readonly webpackRules: AsyncSeriesWaterfallHook<any[]>;
  readonly webpackConfig: AsyncSeriesWaterfallHook<WebpackConfiguration>;
}

export interface ServiceWorkerBuildConfigurationHooks
  extends BrowserBuildConfigurationHooks {}

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
