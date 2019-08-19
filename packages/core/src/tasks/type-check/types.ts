import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Step, TypeCheckRootConfigurationHooks} from '@sewing-kit/types';
import {Workspace} from '../../workspace';

export interface TypeCheckOptions {
  heap?: number;
  watch?: boolean;
}

interface TypeCheckStepDetails {
  readonly configuration: TypeCheckRootConfigurationHooks;
}

export interface TypeCheckTaskHooks {
  readonly configure: AsyncSeriesHook<TypeCheckRootConfigurationHooks>;
  readonly pre: AsyncSeriesWaterfallHook<Step[], TypeCheckStepDetails>;
  readonly steps: AsyncSeriesWaterfallHook<Step[], TypeCheckStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], TypeCheckStepDetails>;
}

export interface TypeCheckTask {
  readonly hooks: TypeCheckTaskHooks;
  readonly options: TypeCheckOptions;
  readonly workspace: Workspace;
}
