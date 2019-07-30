import {PackageCreateOptions, PackageEntry, PackageBinary} from './workspace';

class PackageCreator {
  public readonly options: Partial<PackageCreateOptions> = {};

  entry(entry: PackageEntry) {
    this.options.entries = this.options.entries || [];
    this.options.entries.push(entry);
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
    const creator = new PackageCreator();
    await create(creator);
    return creator.options;
  };
}
