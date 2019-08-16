export enum Runtime {
  Node = 'node',
  Browser = 'browser',
  ServiceWorker = 'service-worker',
  WebWorker = 'web-worker',
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

class PackageCreator {
  constructor(private readonly options: any) {}

  runtime(defaultRuntime: Runtime) {
    this.options.runtime = defaultRuntime;
  }

  entry(entry: PackageEntry) {
    this.options.entries = this.options.entries || [];
    this.options.entries.push({runtime: this.options.runtime, ...entry});
  }

  binary(binary: PackageBinary) {
    this.options.binaries = this.options.binaries || [];
    this.options.binaries.push(binary);
  }
}

export function createPackage(
  create: (pkg: PackageCreator) => void | Promise<void>,
) {
  return async () => {
    const options: any = {};
    const creator = new PackageCreator(options);
    await create(creator);
    return options;
  };
}
