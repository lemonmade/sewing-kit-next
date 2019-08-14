import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Workspace} from '../../workspace';
import {Step} from '../../runner';

export interface TypeCheckOptions {
  heap?: number;
  watch?: boolean;
}

export interface TypeCheckRootConfigurationCustomHooks {}
export interface TypeCheckRootConfigurationCoreHooks {}

export interface TypeCheckRootConfigurationHooks
  extends TypeCheckRootConfigurationCoreHooks,
    Partial<TypeCheckRootConfigurationCustomHooks> {}

export interface TypeCheckTaskHooks {
  configure: AsyncSeriesHook<TypeCheckRootConfigurationHooks>;
  pre: AsyncSeriesWaterfallHook<Step[]>;
  steps: AsyncSeriesWaterfallHook<Step[]>;
  post: AsyncSeriesWaterfallHook<Step[]>;
}

export interface TypeCheckTask {
  hooks: TypeCheckTaskHooks;
  options: TypeCheckOptions;
  workspace: Workspace;
}
