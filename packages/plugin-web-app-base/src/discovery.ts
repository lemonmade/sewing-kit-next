import {DiscoveryTask, WebApp} from '@sewing-kit/core';
import {loadConfig} from '@sewing-kit/config/load';
import {PLUGIN} from './common';

export default function discoverWebApps({
  hooks,
  fs,
  root,
  name,
}: DiscoveryTask) {
  hooks.webApps.tapPromise(PLUGIN, async (webApps) => {
    return (await fs.hasFile('client/index.*'))
      ? [
          ...webApps,
          new WebApp({
            name,
            root,
            entry: fs.resolvePath('client'),
            ...loadConfig(root),
          }),
        ]
      : webApps;
  });
}
