import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Configuration as WebpackConfiguration} from 'webpack';

import {Package, WebApp} from '../../workspace';
import {Env} from '../../types';

export interface Environment {
  readonly actual: Env;
  readonly simulate: Env;
}

export interface BabelConfig {
  presets?: (string | [string, object?])[];
}

export interface Step {
  run(): Promise<void>;
}

// PACKAGE

export interface PackageBuildOptions {}

export interface PackageBuildConfigurationHooks {
  readonly babel: AsyncSeriesWaterfallHook<
    BabelConfig,
    Partial<PackageBuildOptions>
  >;

  readonly extensions: AsyncSeriesWaterfallHook<
    string[],
    Partial<PackageBuildOptions>
  >;

  readonly output: AsyncSeriesWaterfallHook<
    string,
    Partial<PackageBuildOptions>
  >;
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
  readonly babel: AsyncSeriesWaterfallHook<
    BabelConfig,
    Partial<WebAppBuildOptions>
  >;
  readonly output: AsyncSeriesWaterfallHook<
    string,
    Partial<WebAppBuildOptions>
  >;
  readonly entries: AsyncSeriesWaterfallHook<
    string[],
    Partial<WebAppBuildOptions>
  >;
  readonly extensions: AsyncSeriesWaterfallHook<
    string[],
    Partial<WebAppBuildOptions>
  >;
  readonly filename: AsyncSeriesWaterfallHook<
    string,
    Partial<WebAppBuildOptions>
  >;
  readonly webpackRules: AsyncSeriesWaterfallHook<
    any[],
    Partial<WebAppBuildOptions>
  >;
  readonly webpackConfig: AsyncSeriesWaterfallHook<
    WebpackConfiguration,
    Partial<WebAppBuildOptions>
  >;
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

export interface BuildTaskHooks {
  readonly pre: AsyncSeriesWaterfallHook<Step[]>;

  readonly project: AsyncSeriesHook<
    WebApp | Package,
    WebAppBuildHooks | PackageBuildHooks
  >;
  readonly package: AsyncSeriesHook<Package, PackageBuildHooks>;
  readonly webApp: AsyncSeriesHook<WebApp, WebAppBuildHooks>;

  readonly post: AsyncSeriesWaterfallHook<Step[]>;
}
