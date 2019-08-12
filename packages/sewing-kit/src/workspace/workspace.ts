import {Runtime} from '../types';
import {FileSystem, SewingKitFileSystem} from './fs';
import {PackageJson} from './dependencies';

interface DependencyOptions {
  all?: boolean;
  dev?: boolean;
  prod?: boolean;
}

interface ProjectOptions {
  name: string;
  root: string;
}

export class Project {
  readonly name: string;
  readonly root: string;
  readonly fs: FileSystem;
  readonly id = this.name;
  protected readonly packageJson?: PackageJson;

  constructor({name, root}: ProjectOptions) {
    this.name = name;
    this.root = root;
    this.fs = new FileSystem(root);
    this.packageJson = PackageJson.load(this.root);
  }

  dependencies({prod = true, dev, all}: DependencyOptions = {}) {
    const dependencies: string[] = [];

    if (this.packageJson == null) {
      return dependencies;
    }

    if (prod || all) {
      dependencies.push(...Object.keys(this.packageJson.dependencies));
    }

    if (dev || all) {
      dependencies.push(...Object.keys(this.packageJson.devDependencies));
    }

    return dependencies;
  }

  // eslint-disable-next-line require-await
  async hasDependency(
    name: string,
    _options?: DependencyOptions & {version?: string},
  ): Promise<boolean> {
    const {packageJson} = this;

    return packageJson != null && packageJson.dependency(name) != null;
  }
}

interface WorkspaceCreateOptions extends ProjectOptions {
  webApps: WebApp[];
  packages: Package[];
  services: Service[];
}

export class Workspace extends Project {
  readonly internal = new SewingKitFileSystem(this.root);
  readonly webApps: readonly WebApp[];
  readonly packages: readonly Package[];
  readonly services: readonly Service[];

  get private() {
    return this.webApps.length > 0 || this.services.length > 0;
  }

  constructor({webApps, packages, services, ...rest}: WorkspaceCreateOptions) {
    super(rest);

    this.webApps = webApps;
    this.packages = packages;
    this.services = services;
  }
}

interface WebAppCreateOptions extends ProjectOptions {
  entry: string;
  options?: Partial<WebAppOptions>;
  serviceWorker?: string;
}

export class WebApp extends Project {
  readonly entry: string;
  readonly options: Partial<WebAppOptions>;
  readonly serviceWorker?: string;

  get id() {
    return `webApp-${this.name}`;
  }

  constructor({
    entry,
    options = {},
    serviceWorker,
    ...rest
  }: WebAppCreateOptions) {
    super(rest);

    this.entry = entry;
    this.options = options;
    this.serviceWorker = serviceWorker;
  }
}

export interface WebAppOptions {}

export interface PackageCreateOptions extends ProjectOptions {
  entries: PackageEntry[];
  binaries: PackageBinary[];
}

export class Package extends Project {
  readonly entries: PackageEntry[];
  readonly binaries: PackageBinary[];

  get id() {
    return `package-${this.name}`;
  }

  get runtimeName() {
    return (this.packageJson && this.packageJson.name) || this.name;
  }

  constructor({entries, binaries, ...rest}: PackageCreateOptions) {
    super(rest);

    this.entries = entries;
    this.binaries = binaries;
  }
}

export interface PackageBinary {
  readonly name: string;
  readonly root: string;
  readonly aliases?: string[];
}

export interface PackageEntryOptions {}

export interface PackageEntry {
  readonly root: string;
  readonly name?: string;
  readonly options?: Partial<PackageEntryOptions>;
  readonly runtime?: Runtime;
}

interface ServiceCreateOptions extends ProjectOptions {
  entry: string;
}

export class Service extends Project {
  readonly entry: string;

  get id() {
    return `service-${this.name}`;
  }

  constructor({entry, ...rest}: ServiceCreateOptions) {
    super(rest);
    this.entry = entry;
  }
}
