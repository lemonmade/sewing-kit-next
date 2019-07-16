import {produce} from 'immer';

import {Work} from '../work';

const PLUGIN = 'SewingKit.json';

export default function json(work: Work) {
  work.tasks.build.tap(PLUGIN, (build) => {
    build.webpack.browser.tap(PLUGIN, (browserBuild) => {
      browserBuild.hooks.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift('.json');
        }),
      );
    });
  });
}
