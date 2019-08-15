import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Workspace} from '../../workspace';
import {Step} from '../../runner';

export interface LintTaskOptions {
  readonly fix?: boolean;
}

export interface LintRootConfigurationCustomHooks {}
export interface LintRootConfigurationCoreHooks {}

export interface LintRootConfigurationHooks
  extends LintRootConfigurationCoreHooks,
    Partial<LintRootConfigurationCustomHooks> {}

interface LintStepDetails {
  readonly configuration: LintRootConfigurationHooks;
}

export interface LintTaskHooks {
  readonly configure: AsyncSeriesHook<LintRootConfigurationHooks>;
  readonly pre: AsyncSeriesWaterfallHook<Step[], LintStepDetails>;
  readonly steps: AsyncSeriesWaterfallHook<Step[], LintStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], LintStepDetails>;
}

export interface LintTask {
  readonly hooks: LintTaskHooks;
  readonly options: LintTaskOptions;
  readonly workspace: Workspace;
}
