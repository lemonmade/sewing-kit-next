import {AsyncSeriesWaterfallHook} from 'tapable';
import {addHooks, createRootPlugin} from '@sewing-kit/plugin-utilities';
import {BabelConfig} from './types';

interface BabelHooks {
  readonly babelConfig: AsyncSeriesWaterfallHook<BabelConfig>;
}

declare module '@sewing-kit/core/build/ts/tasks/testing/types' {
  interface TestProjectConfigurationCustomHooks extends BabelHooks {}
}

declare module '@sewing-kit/core/build/ts/tasks/build/types' {
  interface BuildPackageConfigurationCustomHooks extends BabelHooks {}
  interface BuildBrowserConfigurationCustomHooks extends BabelHooks {}
}

const PLUGIN = 'SewingKit.babel';

const addBabelHooks = addHooks(() => ({
  babelConfig: new AsyncSeriesWaterfallHook<BabelConfig>(['babelConfig']),
}));

export default createRootPlugin(PLUGIN, (tasks) => {
  tasks.build.tap(PLUGIN, ({hooks}) => {
    hooks.package.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, addBabelHooks);
    });

    hooks.webApp.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, addBabelHooks);
    });
  });

  tasks.test.tap(PLUGIN, ({hooks}) => {
    hooks.project.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, addBabelHooks);
    });
  });
});
