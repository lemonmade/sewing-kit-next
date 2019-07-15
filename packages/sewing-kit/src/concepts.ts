import {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncSeriesWaterfallHook, SyncHook, AsyncSeriesBailHook, AsyncParallelHook} from 'tapable';

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

export enum BuildType {
  Service = 'service',
  Browser = 'browser',
  Package = 'package',
}

export interface BrowserEntryOptions {}

export interface BrowserEntryVariants {}

export interface BrowserEntry {
  readonly id: string;
  readonly name: string;
  readonly type: BuildType.Browser;
  readonly assets: Assets;
  readonly roots: string[];
  readonly runtime: Runtime.Browser;
  readonly options: BrowserEntryOptions;
  readonly variants: VariantValues<BrowserEntryVariants>;
}

export interface ServiceWorker {
  readonly variants: VariantValues<BrowserEntryVariants>;
}

export interface BrowserApp {
  readonly name: string;
  readonly entries: Set<BrowserEntry>;
  readonly serviceWorker?: ServiceWorker;
}

export interface PackageBuildOptions {}

export interface PackageBuildVariants {}

export interface PackageEntry {
  readonly name: string;
  readonly type: BuildType.Package;
  readonly roots: string[];
  readonly runtime: Runtime;
  readonly options: PackageBuildOptions;
  readonly variants: VariantValues<PackageBuildVariants>;
}

export interface Package {
  readonly entries: Set<PackageEntry>;
}

export interface Service {
  readonly type: BuildType.Service;
  readonly runtime: Runtime.Node;
}

export class Workspace {
  readonly packages = new Set<Package>();
  readonly services = new Set<Service>();
  readonly browserApps = new Set<BrowserApp>();

  constructor(public readonly root: string) {}
}

export type BuildTarget = Service | PackageEntry | BrowserEntry;

export class Build {
  readonly configuration = new BuildConfiguration();
  readonly hooks = {
    rules: new AsyncSeriesWaterfallHook<any[], BuildTarget>(['rules', 'target']),
    extensions: new AsyncSeriesWaterfallHook<string[], BuildTarget>(['extensions', 'target']),
    config: new AsyncSeriesWaterfallHook<WebpackConfiguration, BuildTarget>(['config', 'target']),
  };
}

export interface BabelConfig {
  presets: any[];
}

export class BuildConfiguration {
  readonly hooks = {
    babel: new AsyncSeriesWaterfallHook<BabelConfig, BuildTarget>(['config', 'target']),
  };
}

export class WorkspaceDiscovery {
  readonly hooks = {
    discover: new AsyncParallelHook<string>(['root']),
    browserApp: new AsyncSeriesBailHook<BrowserApp, never, never, boolean>(['app']),
    service: new AsyncSeriesBailHook<Service, never, never, boolean>(['service']),
    package: new AsyncSeriesBailHook<Package, never, never, boolean>(['package']),
  }

  private readonly workspace: Workspace;

  constructor(public readonly root: string) {
    this.workspace = new Workspace(root);
  }

  async discover() {
    await this.hooks.discover.promise(this.workspace.root);
    return this.workspace;
  }

  async addBrowserApp(app: BrowserApp) {
    const include = await this.hooks.browserApp.promise(app);

    if (include !== false) {
      this.workspace.browserApps.add(app);
    }
  }

  async addPackage(aPackage: Package) {
    const include = await this.hooks.package.promise(aPackage);

    if (include !== false) {
      this.workspace.packages.add(aPackage);
    }
  }

  async addService(service: Service) {
    const include = await this.hooks.service.promise(service);

    if (include !== false) {
      this.workspace.services.add(service);
    }
  }
}

export class Work {
  readonly hooks = {
    build: new SyncHook<Build, Workspace>(['build', 'workspace']),
    discovery: new SyncHook<WorkspaceDiscovery>(['workspace']),
  };
}
