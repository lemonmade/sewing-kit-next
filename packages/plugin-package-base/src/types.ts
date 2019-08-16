import {AsyncSeriesWaterfallHook} from 'tapable';

declare module '@sewing-kit/core/build/ts/tasks/build/types' {
  interface BuildRootConfigurationCustomHooks {
    readonly packageBuildArtifacts: AsyncSeriesWaterfallHook<string[]>;
  }
}
