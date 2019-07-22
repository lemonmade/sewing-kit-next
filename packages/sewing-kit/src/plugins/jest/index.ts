import {produce} from 'immer';
import {Work} from '../../work';

const PLUGIN = 'SewingKit.jest';

export default function json(work: Work) {
  work.tasks.test.tap(PLUGIN, (test) => {
    test.configureRoot.jestWatchPlugins.tap(
      PLUGIN,
      produce((watchPlugins: string[]) => {
        watchPlugins.push(
          'jest-watch-typeahead/filename',
          'jest-watch-typeahead/testname',
        );
      }),
    );
  });
}
