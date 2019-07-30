import {AsyncSeriesHook} from 'tapable';

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
    lint: new AsyncSeriesHook<import('./tasks/lint').LintTask>(['lint']),
  };
}
