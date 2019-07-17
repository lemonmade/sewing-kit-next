import {basename, resolve} from 'path';
import glob from 'glob';

export interface Assets {
  readonly scripts: boolean;
  readonly styles: boolean;
  readonly images: boolean;
  readonly files: boolean;
}

export enum Runtime {
  Node = 'node',
  Browser = 'browser',
  ServiceWorker = 'service-worker',
  WebWorker = 'web-worker',
}

export enum BuildType {
  Service = 'service',
  Browser = 'browser',
  Package = 'package',
}

export interface WebAppOptions {}

export interface ServiceWorker {
  readonly root: string;
  readonly runtime: Runtime.ServiceWorker;
}

export interface WebApp {
  readonly name: string;
  readonly root: string;
  readonly assets: Assets;
  readonly runtime: Runtime.Browser;
  readonly options: WebAppOptions;
  readonly serviceWorker?: ServiceWorker;
}

export interface PackageBuildOptions {}

export interface PackageEntry {
  readonly name: string;
  readonly root: string;
  readonly options: PackageBuildOptions;
  readonly runtime?: Runtime;
}

export interface Package {
  readonly name: string;
  readonly root: string;
  readonly entries: readonly PackageEntry[];
}

export interface Service {
  readonly type: BuildType.Service;
  readonly runtime: Runtime.Node;
}

export interface Workspace {
  readonly apps: WebApp[];
  readonly packages: Package[];
  readonly services: Service[];
  readonly root: string;
}

export class Project {
  get name() {
    return basename(this.root);
  }

  constructor(private readonly root: string) {}

  async hasFile(file: string) {
    return glob.sync(file, {nodir: true, cwd: this.root}).length > 0;
  }

  resolve(path: string) {
    return resolve(this.root, path);
  }
}
