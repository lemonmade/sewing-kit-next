import {resolve} from 'path';
import {produce} from 'immer';

import {DiscoveryTask} from '../../tasks/discovery';
import {WebApp} from '../../workspace';
import {PLUGIN} from './common';

export default function browserAppDiscovery(discovery: DiscoveryTask) {
  discovery.hooks.webApps.tapPromise(PLUGIN, async (webApps) => {
    if (!(await discovery.fs.hasFile('client/index.*'))) {
      return webApps;
    }

    return produce(webApps, (webApps) => {
      webApps.push(
        new WebApp({
          name: discovery.name,
          root: discovery.root,
          entry: resolve(discovery.root, 'client'),
        }),
      );
    });
  });
}
