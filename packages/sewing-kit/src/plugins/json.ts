import {produce} from 'immer';

import {Work} from '../work';

const PLUGIN = 'SewingKit.json';

function addJsonExtension(extensions: string[]) {
  return ['.json', ...extensions];
}

export default function json(work: Work) {
  work.tasks.build.tap(PLUGIN, (_, buildTaskHooks) => {
    buildTaskHooks.package.tap(PLUGIN, (_, buildHooks) => {
      buildHooks.configure.tap(PLUGIN, (configurationHooks) => {
        configurationHooks.extensions.tap(PLUGIN, addJsonExtension);
      });
    });

    buildTaskHooks.webApp.tap(PLUGIN, (_, buildHooks) => {
      buildHooks.configure.tap(PLUGIN, (configurationHooks) => {
        configurationHooks.extensions.tap(PLUGIN, addJsonExtension);
      });
    });
  });

  work.tasks.test.tap(PLUGIN, (_, testTaskHooks) => {
    testTaskHooks.configure.common.tap(PLUGIN, (configuration) => {
      configuration.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift('.json');
        }),
      );
    });
  });
}
