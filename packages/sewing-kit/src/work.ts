import {AsyncSeriesHook} from 'tapable';

export class Work {
  readonly tasks = {
    discovery: new AsyncSeriesHook<import('./tasks/discovery').DiscoveryTask>([
      'workspaceTask',
    ]),
    build: new AsyncSeriesHook<import('./tasks/build').BuildTask>([
      'buildTask',
    ]),
    test: new AsyncSeriesHook<import('./tasks/testing').TestTask>(['testTask']),
    lint: new AsyncSeriesHook<import('./tasks/lint').LintTask>(['lintTask']),
  };
}
