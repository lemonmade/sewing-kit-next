import {
  Runtime,
  Plugin,
  PackageCreateOptions,
  PackageEntryCreateOptions,
  PackageBinaryCreateOptions,
} from '@sewing-kit/types';
import {OptionBuilder} from './types';

class PackageCreator {
  constructor(private readonly builder: OptionBuilder<PackageCreateOptions>) {}

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

  plugin(...plugins: Plugin[]) {
    this.builder.plugins = this.builder.plugins || [];
    this.builder.plugins.push(...plugins);
  }
}

export function createPackage(
  create: (pkg: PackageCreator) => void | Promise<void>,
) {
  return async () => {
    const options: OptionBuilder<PackageCreateOptions> = {};
    const creator = new PackageCreator(options);
    await create(creator);
    return options;
  };
}
