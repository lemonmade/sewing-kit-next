import {Work} from '../../work';

const PLUGIN = 'SewingKit.base';

export default function base(work: Work) {
  work.tasks.test.tap(PLUGIN, ({hooks, workspace}) => {
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
