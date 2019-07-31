import {Work} from '../work';

const PLUGIN = 'SewingKit.json';

function addJsonExtension(extensions: string[]) {
  return ['.json', ...extensions];
}

export default function json(work: Work) {
  work.tasks.build.tap(PLUGIN, ({hooks}) => {
    hooks.package.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, (configurationHooks) => {
        configurationHooks.extensions.tap(PLUGIN, addJsonExtension);
      });
    });

    hooks.webApp.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, (configurationHooks) => {
        configurationHooks.extensions.tap(PLUGIN, addJsonExtension);
      });
    });
  });

  work.tasks.test.tap(PLUGIN, ({hooks}) => {
    hooks.configureProject.tap(PLUGIN, ({hooks}) => {
      hooks.extensions.tap(PLUGIN, addJsonExtension);
    });
  });
}
