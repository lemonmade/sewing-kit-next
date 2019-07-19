import {resolve} from 'path';
import {produce} from 'immer';

import {WorkspaceDiscovery} from '../../tasks/discovery';
import {PLUGIN} from './common';

export default function browserAppDiscovery(discovery: WorkspaceDiscovery) {
  discovery.hooks.apps.tapPromise(PLUGIN, async (apps) => {
    if (!(await discovery.fs.hasFile('client/index.*'))) {
      return apps;
    }

    return produce(apps, (apps) => {
      apps.push({
        fs: discovery.fs,
        name: discovery.name,
        root: discovery.root,
        dependencies: discovery.dependencies,
        options: {},
        entry: resolve(discovery.root, 'client'),
        assets: {scripts: true, styles: true, images: true, files: true},
      });
    });
  });
}
