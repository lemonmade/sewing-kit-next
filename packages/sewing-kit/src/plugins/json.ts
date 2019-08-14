import {RunnerTasks} from '../runner';

const PLUGIN = 'SewingKit.json';

function addJsonExtension(extensions: string[]) {
  return ['.json', ...extensions];
}

export default function json(tasks: RunnerTasks) {
  tasks.build.tap(PLUGIN, ({hooks}) => {
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

  tasks.test.tap(PLUGIN, ({hooks}) => {
    hooks.project.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, (hooks) => {
        if (hooks.jestExtensions) {
          hooks.jestExtensions.tap(PLUGIN, addJsonExtension);
        }
      });
    });
  });
}
