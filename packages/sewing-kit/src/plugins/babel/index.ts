import {AsyncSeriesWaterfallHook} from 'tapable';
import {RunnerTasks} from '../../runner';
import {addHooks} from '../utilities';

export interface BabelConfig {
  presets?: (string | [string, object?])[];
  plugins?: string[];
}

interface BabelHooks {
  readonly babelConfig: AsyncSeriesWaterfallHook<BabelConfig>;
}

declare module '../../tasks/build/types' {
  interface PackageBuildConfigurationCustomHooks extends BabelHooks {}

  interface BrowserBuildConfigurationCustomHooks extends BabelHooks {}
}

declare module '../../tasks/testing/types' {
  interface ProjectConfigurationCustomHooks extends BabelHooks {}
}

const PLUGIN = 'SewingKit.babel';

const addBabelHooks = addHooks<Partial<BabelHooks>>(() => ({
  babelConfig: new AsyncSeriesWaterfallHook(['babelConfig']),
}));

export default function babel(tasks: RunnerTasks) {
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
}
