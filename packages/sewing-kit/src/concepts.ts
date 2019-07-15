import {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncSeriesWaterfallHook, SyncHook} from 'tapable';

export interface Assets {
  readonly scripts: boolean;
  readonly styles: boolean;
  readonly images: boolean;
  readonly files: boolean;
}

type VariantValues<T> = {
  [K in keyof T]: {name: K; value: T[K]};
}[keyof T][];

export enum Runtime {
  Node = 'node',
  Browser = 'browser',
  ServiceWorker = 'service-worker',
}

export interface BrowserBuildOptions {}

export interface BrowserBuildVariants {}

export interface BrowserBuild {
  readonly id: string;
  readonly assets: Assets;
  readonly roots: string[];
  readonly runtime: Runtime.Browser;
  readonly options: BrowserBuildOptions;
  readonly variants: VariantValues<BrowserBuildVariants>;
}

export interface ServiceWorker {
  readonly variants: VariantValues<BrowserBuildVariants>;
}

export interface BrowserApp {
  readonly name: string;
  readonly builds: Set<BrowserBuild>;
  readonly serviceWorker?: ServiceWorker;
}

export interface PackageBuildOptions {}

export interface PackageBuildVariants {}

export interface PackageEntry {
  readonly roots: string[];
  readonly runtime: Runtime;
  readonly options: PackageBuildOptions;
  readonly variants: VariantValues<PackageBuildVariants>;
}

export interface Package {
  readonly entries: Set<PackageEntry>;
}

export interface Service {}

export class Workspace {
  readonly packages = new Set<Package>();
  readonly services = new Set<Service>();
  readonly browserApps = new Set<BrowserApp>();
}

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
