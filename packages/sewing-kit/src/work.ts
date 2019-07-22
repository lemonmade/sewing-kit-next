import {AsyncSeriesHook} from 'tapable';
import * as plugins from './plugins';

const DEFAULT_PLUGINS = Object.values(plugins);

export class Work {
  readonly tasks = {
    discovery: new AsyncSeriesHook<
      import('./tasks/discovery').WorkspaceDiscovery
    >(['workspace']),
    build: new AsyncSeriesHook<
      import('./tasks/build').BuildTask,
      import('./workspace').Workspace
    >(['build', 'env', 'workspace']),
    test: new AsyncSeriesHook<
      import('./tasks/testing').TestTask,
      import('./workspace').Workspace
    >(['test', 'workspace']),
  };
}

export async function loadWork() {
  const work = new Work();

  for (const plugin of DEFAULT_PLUGINS) {
    plugin.call(work, work);
  }

  return work;
}
