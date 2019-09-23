import {AsyncSeriesWaterfallHook} from 'tapable';
import {
  createPlugin,
  PluginTarget,
  addHooks,
} from '@sewing-kit/plugin-utilities';
import {createStep} from '@sewing-kit/ui';

const PLUGIN = 'SewingKit.devServer';

interface DevServer {
  readonly ip: string;
  readonly port: number;
}

class BuildCollector {
  add(project: any) {
    console.log(project);
  }
}

interface BuildCollectorDetails {
  readonly buildCollector: BuildCollector;
}

declare module '@sewing-kit/types' {
  interface DevRootConfigurationCustomHooks {
    readonly devServer: AsyncSeriesWaterfallHook<DevServer>;
  }

  interface DevPackageStepCustomDetails extends BuildCollectorDetails {}
  interface DevServiceStepCustomDetails extends BuildCollectorDetails {}
  interface DevWebAppStepCustomDetails extends BuildCollectorDetails {}
}

const addDevServerHooks = addHooks(() => ({
  devServer: new AsyncSeriesWaterfallHook(['devServer']),
}));

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.dev.tap(PLUGIN, ({hooks}) => {
      const buildCollector = new BuildCollector();

      const addBuildCollector = addHooks(() => ({buildCollector}));

      hooks.configure.tap(PLUGIN, addDevServerHooks);

      hooks.pre.tap(PLUGIN, (steps) => [
        ...steps,
        createStep(
          {indefinite: true, label: 'Starting development dashboard'},
          async () => {},
        ),
      ]);

      hooks.package.tap(PLUGIN, ({hooks}) => {
        hooks.details.tap(PLUGIN, addBuildCollector);
      });

      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.details.tap(PLUGIN, addBuildCollector);
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.details.tap(PLUGIN, addBuildCollector);
      });
    });
  },
);
