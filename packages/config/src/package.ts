import {
  Runtime,
  PackageCreateOptions,
  PackageEntryCreateOptions,
  PackageBinaryCreateOptions,
} from '@sewing-kit/types';

class PackageCreator {
  constructor(private readonly options: Partial<PackageCreateOptions>) {}

  runtime(defaultRuntime: Runtime) {
    this.options.runtime = defaultRuntime;
  }

  entry(entry: PackageEntryCreateOptions) {
    this.options.entries = this.options.entries || [];
    this.options.entries.push({runtime: this.options.runtime, ...entry});
  }

  binary(binary: PackageBinaryCreateOptions) {
    this.options.binaries = this.options.binaries || [];
    this.options.binaries.push(binary);
  }
}

export function createPackage(
  create: (pkg: PackageCreator) => void | Promise<void>,
) {
  return async () => {
    const options: Partial<PackageCreateOptions> = {};
    const creator = new PackageCreator(options);
    await create(creator);
    return options;
  };
}
