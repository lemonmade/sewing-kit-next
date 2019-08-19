import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Step, LintRootConfigurationHooks} from '@sewing-kit/types';
import {Workspace} from '../../workspace';

export interface LintTaskOptions {
  readonly fix?: boolean;
}

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
