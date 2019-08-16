import {basename} from 'path';
import {AsyncSeriesWaterfallHook} from 'tapable';
import {loadConfig} from '@sewing-kit/config/load';

import {WebApp, Service, Package, Workspace, FileSystem} from '../../workspace';
import {Runner} from '../../runner';

export interface DiscoveryHooks {
  readonly webApps: AsyncSeriesWaterfallHook<WebApp[]>;
  readonly services: AsyncSeriesWaterfallHook<Service[]>;
  readonly packages: AsyncSeriesWaterfallHook<Package[]>;
}

export interface DiscoveryTaskOptions {
  root?: string;
}

export interface DiscoveryTask {
  fs: FileSystem;
  name: string;
  root: string;
  hooks: DiscoveryHooks;
  options: DiscoveryTaskOptions;
}

export async function runDiscovery(
  options: DiscoveryTaskOptions,
  runner: Runner,
) {
  const hooks: DiscoveryHooks = {
    webApps: new AsyncSeriesWaterfallHook(['webApps']),
    packages: new AsyncSeriesWaterfallHook(['packages']),
    services: new AsyncSeriesWaterfallHook(['services']),
  };

  const {root = process.cwd()} = options;
  const name = basename(root);
  const fs = new FileSystem(root);

  const {plugins = []} = await loadConfig(root);

  for (const plugin of plugins) {
    plugin(runner.tasks);
  }

  await runner.tasks.discovery.promise({
    fs,
    name,
    root,
    hooks,
    options,
  });

  const [webApps, services, packages] = await Promise.all([
    hooks.webApps.promise([]),
    hooks.services.promise([]),
    hooks.packages.promise([]),
  ]);

  return new Workspace({
    name,
    root,
    webApps,
    services,
    packages,
  });
}
