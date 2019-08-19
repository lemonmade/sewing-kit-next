import {basename} from 'path';
import {PackageCreateOptions} from '@sewing-kit/types';
import {DiscoveryTask, Package} from '@sewing-kit/core';
import {loadConfig} from '@sewing-kit/config/load';
import {PLUGIN} from './common';

export default function discoverPackages({
  hooks,
  fs,
  root,
  name,
}: DiscoveryTask) {
  hooks.packages.tapPromise(PLUGIN, async (packages) => {
    if (await fs.hasFile('src/index.*')) {
      const customConfig = await loadConfig<PackageCreateOptions>(root);

      return [
        ...packages,
        new Package({
          root,
          name,
          binaries: [],
          entries: [{root: 'src', runtime: customConfig.runtime}],
          ...customConfig,
        }),
      ];
    }

    const packageMatches = await fs.glob('packages/*/');
    const newPackages = await Promise.all(
      packageMatches.map(async (root) => {
        const customConfig = await loadConfig<PackageCreateOptions>(root);

        return new Package({
          root,
          name: basename(root),
          binaries: [],
          entries: [{root: 'src', runtime: customConfig.runtime}],
          ...customConfig,
        });
      }),
    );

    return [...packages, ...newPackages];
  });
}
