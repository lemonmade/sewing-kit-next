import {RunnerTasks} from '../../runner';

const PLUGIN = 'SewingKit.base';

export default function base(tasks: RunnerTasks) {
  tasks.test.tap(PLUGIN, ({hooks, workspace}) => {
    hooks.configureRoot.tap(PLUGIN, (hooks) => {
      hooks.watchIgnore.tap(PLUGIN, (watchIgnore) => [
        ...watchIgnore,
        '/tmp/',
        workspace.internal.resolvePath(),
        workspace.fs.buildPath(),
      ]);
    });
  });
}
