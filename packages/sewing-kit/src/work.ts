import {AsyncParallelHook} from 'tapable';

export class Work {
  readonly tasks = {
    discovery: new AsyncParallelHook<
      import('./tasks/discovery').WorkspaceDiscovery
    >(['workspace']),
    build: new AsyncParallelHook<
      import('./tasks/build').BuildTask,
      import('./workspace').Workspace
    >(['build', 'env', 'workspace']),
  };
}
