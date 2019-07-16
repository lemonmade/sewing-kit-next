import {AsyncSeriesBailHook, AsyncParallelHook} from 'tapable';
import {BrowserApp, Service, Package, Workspace} from './concepts';

export class WorkspaceDiscovery {
  readonly hooks = {
    discover: new AsyncParallelHook<string>(['root']),
    browserApp: new AsyncSeriesBailHook<BrowserApp, never, never, boolean>([
      'app',
    ]),
    service: new AsyncSeriesBailHook<Service, never, never, boolean>([
      'service',
    ]),
    package: new AsyncSeriesBailHook<Package, never, never, boolean>([
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

  async addBrowserApp(app: BrowserApp) {
    const include = await this.hooks.browserApp.promise(app);

    if (include !== false) {
      this.workspace.browserApps.add(app);
    }
  }

  async addPackage(pkg: Package) {
    const include = await this.hooks.package.promise(pkg);

    if (include !== false) {
      this.workspace.packages.add(pkg);
    }
  }

  async addService(service: Service) {
    const include = await this.hooks.service.promise(service);

    if (include !== false) {
      this.workspace.services.add(service);
    }
  }
}
