import {AsyncSeriesHook} from 'tapable';

export class Work {
  readonly tasks = {
    discovery: new AsyncSeriesHook<
      import('./tasks/discovery').WorkspaceDiscovery
    >(['workspace']),
    build: new AsyncSeriesHook<
      import('./workspace').Workspace,
      import('./tasks/build').BuildTaskHooks
    >(['build', 'env', 'workspace']),
    test: new AsyncSeriesHook<
      import('./workspace').Workspace,
      import('./tasks/testing').TestTask
    >(['test', 'workspace']),
    lint: new AsyncSeriesHook<
      import('./workspace').Workspace,
      import('./tasks/lint').LintTask
    >(['lint']),
  };
}
