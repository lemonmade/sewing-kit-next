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
  WebWorker = 'web-worker',
}

export enum BuildType {
  Service = 'service',
  Browser = 'browser',
  Package = 'package',
}

export interface BrowserEntryOptions {}

export interface BrowserEntryVariants {}

export interface BrowserEntry {
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
