import {Runtime} from './types';
import {PackageCreateOptions, PackageEntry, PackageBinary} from './workspace';

export {Runtime};

class PackageCreator {
  private defaultRuntime?: Runtime;

  constructor(private readonly options: Partial<PackageCreateOptions>) {}

  runtime(defaultRuntime: Runtime) {
    this.defaultRuntime = defaultRuntime;
  }

  entry(entry: PackageEntry) {
    this.options.entries = this.options.entries || [];
    this.options.entries.push({runtime: this.defaultRuntime, ...entry});
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
    const options = {};
    const creator = new PackageCreator(options);
    await create(creator);
    return options;
  };
}
