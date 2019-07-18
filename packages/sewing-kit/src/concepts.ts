import {resolve, join, dirname} from 'path';
import {writeFile, mkdirp} from 'fs-extra';
import glob, {IOptions as GlobOptions} from 'glob';

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

export interface WebApp extends Project {
  readonly entry: string;
  readonly assets: Assets;
  readonly options: WebAppOptions;
  readonly serviceWorker?: string;
}

export interface PackageBuildOptions {}

export interface PackageEntry {
  readonly name: string;
  readonly root: string;
  readonly options: PackageBuildOptions;
  readonly runtime?: Runtime;
}

export interface Package extends Project {
  readonly entries: readonly PackageEntry[];
}

export interface Service extends Project {
  readonly entry: string;
}

export interface Project {
  readonly name: string;
  readonly root: string;
  readonly fs: FileSystem;
  readonly dependencies: Dependencies;
}

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

export class Dependencies {
  constructor(private readonly root: string) {}
}

export class FileSystem {
  constructor(protected readonly root: string) {}

  async hasFile(file: string) {
    const matches = await this.glob(file, {nodir: true});
    return matches.length > 0;
  }

  async hasDirectory(dir: string) {
    const matches = await this.glob(dir.endsWith('/') ? dir : `${dir}/`);
    return matches.length > 0;
  }

  async glob(pattern: string, options: Omit<GlobOptions, 'cwd'> = {}) {
    return glob.sync(pattern, {...options, cwd: this.root, absolute: true});
  }

  buildPath(...paths: string[]) {
    return this.resolvePath('build', ...paths);
  }

  resolvePath(...paths: string[]) {
    return resolve(this.root, ...paths);
  }
}

export class SewingKitFileSystem extends FileSystem {
  constructor(projectRoot: string) {
    super(join(projectRoot, '.sewing-kit'));
  }

  async write(file: string, contents: string) {
    const resolved = this.resolvePath(file);
    await mkdirp(dirname(resolved));
    await writeFile(resolved, contents);
  }

  configPath(...paths: string[]) {
    return this.resolvePath('config', ...paths);
  }

  cachePath(...paths: string[]) {
    return this.resolvePath('cache', ...paths);
  }

  resolvePath(...paths: string[]) {
    return resolve(this.root, ...paths);
  }
}
