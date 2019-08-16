import {basename} from 'path';
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
      return [
        ...packages,
        new Package({
          root,
          name,
          binaries: [],
          entries: [{root: 'src'}],
          ...(await loadConfig(root)),
        }),
      ];
    }

    const packageMatches = await fs.glob('packages/*/');
    const newPackages = await Promise.all(
      packageMatches.map(async (root) => {
        return new Package({
          root,
          name: basename(root),
          binaries: [],
          entries: [{root: 'src'}],
          ...(await loadConfig(root)),
        });
      }),
    );

    return [...packages, ...newPackages];
  });
}
