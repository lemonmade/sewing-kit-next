import {Plugin, PluginTarget} from '@sewing-kit/types';

export interface RootPlugin extends Plugin {
  readonly target: PluginTarget.Root;
  (tasks: import('./runner').RunnerTasks): void;
}

export interface BuildProjectPlugin extends Plugin {
  readonly target: PluginTarget.BuildProject;
  (details: import('./tasks/build').BuildProjectDetails): void;
}

export interface TestProjectPlugin extends Plugin {
  readonly target: PluginTarget.TestProject;
  (details: import('./tasks/testing').TestProjectDetails): void;
}

export interface PluginTargetMap {
  [PluginTarget.Root]: RootPlugin;
  [PluginTarget.BuildProject]: BuildProjectPlugin;
  [PluginTarget.TestProject]: TestProjectPlugin;
}
