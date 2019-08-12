import {AsyncSeriesWaterfallHook} from 'tapable';
import {RunnerTasks} from '../../runner';
import {addHooks} from '../utilities';

export interface BabelConfig {
  presets?: (string | [string, object?])[];
  plugins?: string[];
}

declare module '../../tasks/build/types' {
  interface PackageBuildConfigurationCustomHooks {
    readonly babelConfig: AsyncSeriesWaterfallHook<BabelConfig>;
  }

  interface BrowserBuildConfigurationCustomHooks {
    readonly babelConfig: AsyncSeriesWaterfallHook<BabelConfig>;
  }
}

declare module '../../tasks/testing/types' {
  interface ProjectConfigurationCustomHooks {
    readonly babelConfig: AsyncSeriesWaterfallHook<BabelConfig>;
  }
}

const PLUGIN = 'SewingKit.babel';

export default function babel(tasks: RunnerTasks) {
  tasks.build.tap(PLUGIN, ({hooks}) => {
    hooks.package.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(
        PLUGIN,
        addHooks(() => ({
          babelConfig: new AsyncSeriesWaterfallHook(['babelConfig']),
        })),
      );
    });

    hooks.webApp.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(
        PLUGIN,
        addHooks(() => ({
          babelConfig: new AsyncSeriesWaterfallHook(['babelConfig']),
        })),
      );
    });
  });
}
