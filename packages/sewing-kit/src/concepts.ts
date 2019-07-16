import {Configuration as WebpackConfiguration} from 'webpack';
import {
  AsyncSeriesWaterfallHook,
  SyncHook,
  AsyncSeriesBailHook,
  AsyncParallelHook,
} from 'tapable';

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
  readonly root: string;
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
    rules: new AsyncSeriesWaterfallHook<any[], BuildTarget>([
      'rules',
      'target',
    ]),
    extensions: new AsyncSeriesWaterfallHook<string[], BuildTarget>([
      'extensions',
      'target',
    ]),
    config: new AsyncSeriesWaterfallHook<WebpackConfiguration, BuildTarget>([
      'config',
      'target',
    ]),
  };
}

export interface BabelConfig {
  presets: any[];
}

export class BuildConfiguration {
  readonly hooks = {
    babel: new AsyncSeriesWaterfallHook<BabelConfig, BuildTarget>([
      'config',
      'target',
    ]),
  };
}

export class BrowserAppDiscovery {
  readonly hooks = {
    discover: new AsyncParallelHook<BrowserApp, never, never>(['app']),
    entries: new AsyncSeriesWaterfallHook<BrowserEntry[]>(['entries']),
    serviceWorker: new AsyncSeriesBailHook<
      ServiceWorker,
      never,
      never,
      boolean
    >(['serviceWorker']),
  };

  async discover() {
    await this.hooks.discover.promise(this.app);
    return this.app;
  }

  async addEntry(entry: BrowserEntry) {
    for (const resolvedEntry of await this.hooks.entries.promise([entry])) {
      this.app.entries.add(resolvedEntry);
    }
  }

  constructor(private readonly app: BrowserApp) {}
}

export class ServiceDiscovery {
  readonly hooks = {
    discover: new AsyncParallelHook<Service>(['service']),
  };

  constructor(private readonly service: Service) {}

  async discover() {
    await this.hooks.discover.promise(this.service);
    return this.service;
  }
}

export class PackageDiscovery {
  readonly hooks = {
    discover: new AsyncParallelHook<Package>(['package']),
    entries: new AsyncSeriesWaterfallHook<PackageEntry[]>(['entry']),
  };

  constructor(private readonly pkg: Package) {}

  async discover() {
    await this.hooks.discover.promise(this.pkg);
    return this.pkg;
  }

  async addEntry(entry: PackageEntry) {
    for (const resolvedEntry of await this.hooks.entries.promise([entry])) {
      this.pkg.entries.add(resolvedEntry);
    }
  }
}

export class WorkspaceDiscovery {
  readonly hooks = {
    discover: new AsyncParallelHook<string>(['root']),
    browserApp: new AsyncSeriesBailHook<
      BrowserAppDiscovery,
      never,
      never,
      boolean
    >(['app']),
    service: new AsyncSeriesBailHook<ServiceDiscovery, never, never, boolean>([
      'service',
    ]),
    package: new AsyncSeriesBailHook<PackageDiscovery, never, never, boolean>([
      'package',
    ]),
  };

  private readonly workspace: Workspace;

  constructor(public readonly root: string) {
    this.workspace = new Workspace(root);
  }

  async discover() {
    await this.hooks.discover.promise(this.workspace.root);
    return this.workspace;
  }

  async addBrowserApp(app: BrowserAppDiscovery) {
    const include = await this.hooks.browserApp.promise(app);

    if (include !== false) {
      this.workspace.browserApps.add(await app.discover());
    }
  }

  async addPackage(pkg: PackageDiscovery) {
    const include = await this.hooks.package.promise(pkg);

    if (include !== false) {
      this.workspace.packages.add(await pkg.discover());
    }
  }

  async addService(service: ServiceDiscovery) {
    const include = await this.hooks.service.promise(service);

    if (include !== false) {
      this.workspace.services.add(await service.discover());
    }
  }
}

export class Work {
  readonly hooks = {
    build: new SyncHook<Build, Workspace>(['build', 'workspace']),
    discovery: new SyncHook<WorkspaceDiscovery>(['workspace']),
  };
}
