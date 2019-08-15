import {AsyncSeriesWaterfallHook} from 'tapable';
import {Configuration as WebpackConfiguration} from 'webpack';
import {RunnerTasks} from '../../runner';
import {addHooks} from '../utilities';

declare module '../../tasks/build/types' {
  interface BuildBrowserConfigurationCustomHooks {
    readonly webpackRules: AsyncSeriesWaterfallHook<any[]>;
    readonly webpackConfig: AsyncSeriesWaterfallHook<WebpackConfiguration>;
  }
}

const PLUGIN = 'SewingKit.babel';

export default function babel(tasks: RunnerTasks) {
  tasks.build.tap(PLUGIN, ({hooks}) => {
    hooks.webApp.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(
        PLUGIN,
        addHooks(() => ({
          webpackRules: new AsyncSeriesWaterfallHook(['webpackRules']),
          webpackConfig: new AsyncSeriesWaterfallHook(['webpackConfig']),
        })),
      );
    });
  });
}
