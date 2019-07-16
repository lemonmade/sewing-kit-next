import {produce} from 'immer';

import {Work} from '../work';

const PLUGIN = 'SewingKit.json';

export default function json(work: Work) {
  work.hooks.build.tap(PLUGIN, (build) => {
    build.hooks.extensions.tap(
      PLUGIN,
      produce((extensions: string[]) => {
        extensions.unshift('.json');
      }),
    );
  });
}
