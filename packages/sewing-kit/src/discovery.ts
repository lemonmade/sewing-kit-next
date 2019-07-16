import {
  AsyncSeriesWaterfallHook,
  AsyncSeriesBailHook,
  AsyncParallelHook,
} from 'tapable';

import {
  BrowserApp,
  BrowserEntry,
  Service,
  Package,
  PackageEntry,
  Workspace,
} from './concepts';

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
