import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  Env,
  Step,
  BuildRootConfigurationHooks,
  BuildWebAppHooks,
  BuildPackageHooks,
} from '@sewing-kit/types';

import {Package, WebApp, Workspace} from '../../workspace';

export interface BuildTaskOptions {
  readonly env: Env;
  readonly simulateEnv: Env;
  readonly sourceMaps?: boolean;
}

interface BuildStepDetails {
  readonly configuration: BuildRootConfigurationHooks;
}

export type BuildProjectDetails =
  | {
      project: WebApp;
      hooks: BuildWebAppHooks;
    }
  | {project: Package; hooks: BuildPackageHooks};

export interface BuildTaskHooks {
  readonly configure: AsyncSeriesHook<BuildRootConfigurationHooks>;

  readonly project: AsyncSeriesHook<BuildProjectDetails>;
  readonly package: AsyncSeriesHook<{pkg: Package; hooks: BuildPackageHooks}>;
  readonly webApp: AsyncSeriesHook<{webApp: WebApp; hooks: BuildWebAppHooks}>;

  readonly pre: AsyncSeriesWaterfallHook<Step[], BuildStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], BuildStepDetails>;
}

export interface BuildTask {
  readonly hooks: BuildTaskHooks;
  readonly options: BuildTaskOptions;
  readonly workspace: Workspace;
}
