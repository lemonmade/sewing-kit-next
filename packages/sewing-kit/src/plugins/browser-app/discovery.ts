import {resolve} from 'path';
import {produce} from 'immer';

import {WorkspaceDiscovery} from '../../tasks/discovery';
import {WebApp} from '../../workspace';
import {PLUGIN} from './common';

export default function browserAppDiscovery(discovery: WorkspaceDiscovery) {
  discovery.hooks.apps.tapPromise(PLUGIN, async (apps) => {
    if (!(await discovery.fs.hasFile('client/index.*'))) {
      return apps;
    }

    return produce(apps, (apps) => {
      apps.push(
        new WebApp({
          name: discovery.name,
          root: discovery.root,
          entry: resolve(discovery.root, 'client'),
        }),
      );
    });
  });
}
