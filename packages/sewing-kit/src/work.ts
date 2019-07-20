import {AsyncParallelHook} from 'tapable';
import * as plugins from './plugins';

const DEFAULT_PLUGINS = Object.values(plugins);

export class Work {
  readonly tasks = {
    discovery: new AsyncParallelHook<
      import('./tasks/discovery').WorkspaceDiscovery
    >(['workspace']),
    build: new AsyncParallelHook<
      import('./tasks/build').BuildTask,
      import('./workspace').Workspace
    >(['build', 'env', 'workspace']),
    test: new AsyncParallelHook<
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
