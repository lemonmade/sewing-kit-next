import {AsyncSeriesWaterfallHook} from 'tapable';
import {Configuration as WebpackConfiguration} from 'webpack';
import {
  addHooks,
  createPlugin,
  PluginTarget,
} from '@sewing-kit/plugin-utilities';

declare module '@sewing-kit/types' {
  interface BuildBrowserConfigurationCustomHooks {
    readonly webpackRules: AsyncSeriesWaterfallHook<any[]>;
    readonly webpackConfig: AsyncSeriesWaterfallHook<WebpackConfiguration>;
  }
}

const PLUGIN = 'SewingKit.webpack';

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
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
  },
);
