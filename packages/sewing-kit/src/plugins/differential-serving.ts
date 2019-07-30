import {dirname, basename, join} from 'path';
import {produce} from 'immer';

import {Work} from '../work';
import {WebAppBuildOptions} from '../tasks/build';

import {updateBabelPreset} from './utilities';

declare module '../tasks/build/types' {
  interface WebAppBuildOptions {
    browserTarget: 'baseline' | 'latest';
  }
}

const PLUGIN = 'SewingKit.differentialServing';

const BROWSER_TARGETS: {
  [K in WebAppBuildOptions['browserTarget']]: string[];
} = {
  baseline: [],
  latest: [],
};

export default function differentialServing(work: Work) {
  work.tasks.build.tap(PLUGIN, (_, buildTaskHooks) => {
    buildTaskHooks.webApp.tap(PLUGIN, (_, buildHooks) => {
      buildHooks.variants.tap(PLUGIN, (variants) =>
        Object.keys(BROWSER_TARGETS).flatMap((browserTarget) =>
          variants.map((build) => ({
            ...build,
            browserTarget: browserTarget as WebAppBuildOptions['browserTarget'],
          })),
        ),
      );

      buildHooks.configure.tap(PLUGIN, (configuration, {browserTarget}) => {
        if (browserTarget == null) {
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
  });
}
