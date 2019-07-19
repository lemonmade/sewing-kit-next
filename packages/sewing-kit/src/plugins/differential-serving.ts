import {dirname, basename, join} from 'path';
import {produce} from 'immer';

import {Work} from '../work';
import {BrowserBuildVariants} from '../tasks/build';

import {updateBabelPreset} from './utilities';

declare module '../tasks/build/types' {
  interface BrowserBuildVariants {
    browserTarget: 'baseline' | 'latest';
  }
}

const PLUGIN = 'SewingKit.differentialServing';

const BROWSER_TARGETS: {
  [K in BrowserBuildVariants['browserTarget']]: string[];
} = {
  baseline: [],
  latest: [],
};

export default function differentialServing(work: Work) {
  work.tasks.build.tap(PLUGIN, (build) => {
    build.variants.apps.tap(PLUGIN, (variants) => {
      variants.add('browserTarget', ['baseline', 'latest']);
    });

    build.configure.browser.tap(PLUGIN, (configuration, _, variant) => {
      const browserTarget = variant.get('browserTarget');

      if (!browserTarget) {
        return;
      }

      configuration.filename.tap(PLUGIN, (filename) => {
        return join(dirname(filename), browserTarget, basename(filename));
      });

      configuration.babel.tap(PLUGIN, (babelConfig) => {
        return produce(
          babelConfig,
          updateBabelPreset(
            ['babel-preset-shopify', 'babel-preset-shopify/web'],
            {browsers: BROWSER_TARGETS[browserTarget]},
          ),
        );
      });
    });
  });
}
