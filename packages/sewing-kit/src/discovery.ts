import {AsyncSeriesWaterfallHook} from 'tapable';
import {WebApp, Service, Package, Workspace} from './concepts';

export class WorkspaceDiscovery {
  readonly hooks = {
    apps: new AsyncSeriesWaterfallHook<WebApp[], never, never>(['apps']),
    services: new AsyncSeriesWaterfallHook<Service[], never, never>([
      'service',
    ]),
    packages: new AsyncSeriesWaterfallHook<Package[], never, never>([
      'packages',
    ]),
  };

  constructor(public readonly root: string) {}

  async discover(): Promise<Workspace> {
    const [apps, services, packages] = await Promise.all([
      this.hooks.apps.promise([]),
      this.hooks.services.promise([]),
      this.hooks.packages.promise([]),
    ]);

    return {apps, services, packages, root: this.root};
  }
}
