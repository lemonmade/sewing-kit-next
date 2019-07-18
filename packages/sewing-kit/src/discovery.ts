import {AsyncSeriesWaterfallHook} from 'tapable';
import {
  WebApp,
  Service,
  Package,
  Workspace,
  Dependencies,
  FileSystem,
  SewingKitFileSystem,
} from './concepts';
import { basename } from 'path';

export class WorkspaceDiscovery {
  readonly name: string;
  readonly fs: FileSystem;
  readonly sewingKit: SewingKitFileSystem;
  readonly dependencies: Dependencies;

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
    this.dependencies = new Dependencies(root);
    this.sewingKit = new SewingKitFileSystem(root);
  }

  async discover(): Promise<Workspace> {
    const [apps, services, packages] = await Promise.all([
      this.hooks.apps.promise([]),
      this.hooks.services.promise([]),
      this.hooks.packages.promise([]),
    ]);

    return {
      name: this.name,
      root: this.root,
      fs: this.fs,
      sewingKit: this.sewingKit,
      dependencies: this.dependencies,
      apps,
      services,
      packages,
    };
  }
}
