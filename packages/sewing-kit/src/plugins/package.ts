import {basename} from 'path';
import {produce} from 'immer';

import {Work} from '../work';
import {FileSystem, Dependencies} from '../workspace';

const PLUGIN = 'SewingKit.packages';

export default function packages(work: Work) {
  work.tasks.discovery.tap(PLUGIN, (discovery) => {
    discovery.hooks.packages.tapPromise(PLUGIN, async (packages) => {
      if (await discovery.fs.hasFile('src/index.*')) {
        const fs = new FileSystem(discovery.root);

        return produce(packages, (packages) => {
          packages.push({
            fs,
            root: discovery.root,
            name: discovery.name,
            dependencies: new Dependencies(discovery.root),
            entries: [
              {
                name: 'main',
                options: {},
                root: fs.resolvePath('src'),
              },
            ],
          });
        });
      }

      const packageMatches = await discovery.fs.glob('packages/*/');
      const newPackages = await Promise.all(
        packageMatches.map((root) => {
          const fs = new FileSystem(root);

          return {
            fs,
            root,
            name: basename(root),
            dependencies: new Dependencies(root),
            entries: [
              {
                name: 'main',
                options: {},
                root: fs.resolvePath(root, 'src'),
              },
            ],
          };
        }),
      );

      return produce(packages, (packages) => {
        packages.push(...newPackages);
      });
    });
  });
}
