import {produce} from 'immer';

import {Work} from '../work';

const PLUGIN = 'SewingKit.json';

export default function json(work: Work) {
  work.tasks.build.tap(PLUGIN, (build) => {
    build.configure.common.tap(PLUGIN, (configuration) => {
      configuration.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift('.json');
        }),
      );
    });
  });

  work.tasks.test.tap(PLUGIN, (test) => {
    test.configure.common.tap(PLUGIN, (configuration) => {
      configuration.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift('.json');
        }),
      );
    });
  });
}
