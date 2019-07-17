import {resolve} from 'path';
import {produce} from 'immer';
import glob from 'glob';

import {Work} from '../work';
import {Runtime} from '../concepts';

const PLUGIN = 'SewingKit.packages';

export default function packages(work: Work) {
  work.tasks.discovery.tap(PLUGIN, (discovery, project) => {
    discovery.hooks.packages.tapPromise(PLUGIN, async (packages) => {
      if (!(await project.hasFile('src/index.*'))) {
        return packages;
      }

      return produce(packages, (packages) => {
        packages.push({
          name: project.name,
          root: project.resolve('src'),
          entries: [
            {
              name: 'main',
              options: {},
              root: project.resolve('src'),
            },
          ],
        });
      });
    });
  });
}
