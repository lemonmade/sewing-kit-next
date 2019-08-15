import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Workspace} from '../../workspace';
import {Step} from '../../runner';

export interface LintTaskOptions {
  fix?: boolean;
}

export interface LintRootConfigurationCustomHooks {}
export interface LintRootConfigurationCoreHooks {}

export interface LintRootConfigurationHooks
  extends LintRootConfigurationCoreHooks,
    Partial<LintRootConfigurationCustomHooks> {}

export interface LintTaskHooks {
  configure: AsyncSeriesHook<LintRootConfigurationHooks>;
  pre: AsyncSeriesWaterfallHook<Step[]>;
  steps: AsyncSeriesWaterfallHook<Step[]>;
  post: AsyncSeriesWaterfallHook<Step[]>;
}

export interface LintTask {
  readonly hooks: LintTaskHooks;
  readonly options: LintTaskOptions;
  readonly workspace: Workspace;
}
