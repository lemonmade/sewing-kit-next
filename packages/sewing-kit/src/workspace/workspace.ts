import {FileSystem, SewingKitFileSystem} from './fs';
import {Dependencies} from './dependencies';

export interface Workspace {
  readonly name: string;
  readonly root: string;
  readonly fs: FileSystem;
  readonly dependencies: Dependencies;
  readonly sewingKit: SewingKitFileSystem;

  readonly apps: readonly WebApp[];
  readonly packages: readonly Package[];
  readonly services: readonly Service[];
}

export interface WebApp extends Project {
  readonly entry: string;
  readonly assets: Assets;
  readonly options: WebAppOptions;
  readonly serviceWorker?: string;
}

export interface Assets {
  readonly scripts: boolean;
  readonly styles: boolean;
  readonly images: boolean;
  readonly files: boolean;
}

export interface WebAppOptions {}

export interface Project {
  readonly name: string;
  readonly root: string;
  readonly fs: FileSystem;
  readonly dependencies: Dependencies;
}

export interface Package extends Project {
  readonly entries: readonly PackageEntry[];
}

export interface PackageOptions {}

export interface PackageEntry {
  readonly name: string;
  readonly root: string;
  readonly options: PackageOptions;
  readonly runtime?: Runtime;
}

export interface Service extends Project {
  readonly entry: string;
}

export enum Runtime {
  Node = 'node',
  Browser = 'browser',
  ServiceWorker = 'service-worker',
  WebWorker = 'web-worker',
}
