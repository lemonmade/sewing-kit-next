import {AsyncSeriesWaterfallHook} from 'tapable';
import {
  WebApp,
  Service,
  Package,
  Workspace,
  FileSystem,
  SewingKitFileSystem,
} from '../../workspace';
import {basename} from 'path';

export class WorkspaceDiscovery {
  readonly name: string;
  readonly fs: FileSystem;
  readonly internal: SewingKitFileSystem;

  readonly hooks = {
    apps: new AsyncSeriesWaterfallHook<WebApp[], never, never>(['apps']),
    services: new AsyncSeriesWaterfallHook<Service[], never, never>([
      'service',
    ]),
    packages: new AsyncSeriesWaterfallHook<Package[], never, never>([
      'packages',
    ]),
  };

  constructor(public readonly root: string) {
    this.name = basename(root);
    this.fs = new FileSystem(root);
    this.internal = new SewingKitFileSystem(root);
  }

  async run(): Promise<Workspace> {
    const [apps, services, packages] = await Promise.all([
      this.hooks.apps.promise([]),
      this.hooks.services.promise([]),
      this.hooks.packages.promise([]),
    ]);

    return new Workspace({
      name: this.name,
      root: this.root,
      apps,
      services,
      packages,
    });
  }
}
