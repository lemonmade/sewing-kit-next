import {
  Runtime,
  PackageCreateOptions,
  PackageEntryCreateOptions,
  PackageBinaryCreateOptions,
} from '@sewing-kit/types';

class PackageCreator {
  constructor(private readonly builder: Partial<PackageCreateOptions>) {}

  runtime(defaultRuntime: Runtime) {
    this.builder.runtime = defaultRuntime;
  }

  entry(entry: PackageEntryCreateOptions) {
    this.builder.entries = this.builder.entries || [];
    this.builder.entries.push({
      runtime: this.builder.runtime,
      ...entry,
    });
  }

  binary(binary: PackageBinaryCreateOptions) {
    this.builder.binaries = this.builder.binaries || [];
    this.builder.binaries.push(binary);
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
