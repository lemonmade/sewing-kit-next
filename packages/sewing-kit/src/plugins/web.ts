import {produce} from 'immer';

import {Work} from '../work';
import {Runtime} from '../concepts';

const PLUGIN = 'SewingKit.web';

export default function web(work: Work) {
  work.hooks.build.tap(PLUGIN, (build) => {
    build.configuration.hooks.babel.tap(PLUGIN, (babelConfig, target) => {
      if (target.runtime !== Runtime.Browser) {
        return babelConfig;
      }

      return produce(babelConfig, (babelConfig) => {
        babelConfig.presets.push([
          'babel-preset-shopify/web',
          {modules: false},
        ]);
      });
    });
  });
}
