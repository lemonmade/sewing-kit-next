import 'core-js/features/array/flat';
import 'core-js/features/array/flat-map';

import {Work} from './work';
import {Env} from './types';
import * as plugins from './plugins';

interface Plugin {
  call(workThis: Work, work: Work): void;
}

export interface Options {
  root: string;
  plugins?: Plugin[];
}

const DEFAULT_PLUGINS: Plugin[] = Object.values(plugins);

export async function run({root, plugins = []}: Options) {
  const work = new Work();

  for (const plugin of DEFAULT_PLUGINS.concat(plugins)) {
    plugin.call(work, work);
  }

  const {WorkspaceDiscovery} = await import('./tasks/discovery');
  const {BuildTask} = await import('./tasks/build');

  const discovery = new WorkspaceDiscovery(root);
  await work.tasks.discovery.promise(discovery);
  const workspace = await discovery.run();

  const env = {actual: Env.Development, simulate: Env.Development};
  const build = new BuildTask(env, workspace);
  await work.tasks.build.promise(build, workspace);
  await build.run();
}
