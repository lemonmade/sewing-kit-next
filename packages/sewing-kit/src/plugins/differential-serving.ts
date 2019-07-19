import {dirname, basename, join} from 'path';
import {produce} from 'immer';
import {Work} from '../work';
import {BrowserBuildVariants} from '../build';

declare module '../build' {
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

    build.configure.browser.tap(PLUGIN, (configuration, browserBuild) => {
      const browserTarget = browserBuild.variant.get('browserTarget');

      if (!browserTarget) {
        return;
      }

      configuration.filename.tap(PLUGIN, (filename) => {
        return join(dirname(filename), browserTarget, basename(filename));
      });

      configuration.babel.tap(PLUGIN, (babelConfig) => {
        return produce(babelConfig, (babelConfig) => {
          for (const preset of babelConfig.presets) {
            if (
              Array.isArray(preset) &&
              preset[0] === 'babel-preset-shopify/web'
            ) {
              preset[1] = preset[1] || {};
              preset[1].browsers = BROWSER_TARGETS[browserTarget];
            }
          }
        });
      });
    });
  });
}
