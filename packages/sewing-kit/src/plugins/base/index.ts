import {produce} from 'immer';
import {Work} from '../../work';

const PLUGIN = 'SewingKit.base';

export default function base(work: Work) {
  work.tasks.test.tap(PLUGIN, (test, workspace) => {
    test.configureRoot.watchIgnore.tap(
      PLUGIN,
      produce((watchIgnore: string[]) => {
        watchIgnore.push(
          '/tmp/',
          workspace.internal.resolvePath(),
          workspace.fs.buildPath(),
        );
      }),
    );
  });
}
