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

export interface BrowserAppOptions {}

export interface ServiceWorker {
  readonly roots: string[];
  readonly runtime: Runtime.ServiceWorker;
}

export interface BrowserApp {
  readonly name: string;
  readonly roots: string[];
  readonly assets: Assets;
  readonly runtime: Runtime.Browser;
  readonly options: BrowserAppOptions;
  readonly serviceWorker?: ServiceWorker;
}

export interface PackageBuildOptions {}

export interface PackageEntry {
  readonly name: string;
  readonly type: BuildType.Package;
  readonly roots: string[];
  readonly runtime: Runtime;
  readonly options: PackageBuildOptions;
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

export class Workspace {
  readonly packages = new Set<Package>();
  readonly services = new Set<Service>();
  readonly browserApps = new Set<BrowserApp>();

  constructor(public readonly root: string) {}
}
