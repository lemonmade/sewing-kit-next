import {basename} from 'path';
import {produce} from 'immer';
import {Work} from '../work';

const PLUGIN = 'SewingKit.packages';

export default function packages(work: Work) {
  work.tasks.discovery.tap(PLUGIN, (discovery, project) => {
    discovery.hooks.packages.tapPromise(PLUGIN, async (packages) => {
      if (await project.hasFile('src/index.*')) {
        return produce(packages, (packages) => {
          packages.push({
            name: project.name,
            root: project.root,
            sourceRoot: project.resolve('src'),
            entries: [
              {
                name: 'main',
                options: {},
                root: project.resolve('src'),
              },
            ],
          });
        });
      }

      const packageMatches = await project.glob('packages/*/');
      const newPackages = await Promise.all(
        packageMatches.map((root) => {
          const sourceRoot = project.resolve(root, 'src');

          return {
            name: basename(root),
            root,
            sourceRoot,
            entries: [
              {
                name: 'main',
                options: {},
                root: sourceRoot,
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
