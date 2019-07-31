import {AsyncSeriesHook} from 'tapable';

export class Work {
  readonly tasks = {
    discovery: new AsyncSeriesHook<import('./tasks/discovery').DiscoveryTask>([
      'workspaceTask',
    ]),
    build: new AsyncSeriesHook<import('./tasks/build').BuildTask>([
      'buildTask',
    ]),
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
