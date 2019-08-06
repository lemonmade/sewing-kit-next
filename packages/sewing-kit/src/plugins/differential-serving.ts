import {dirname, basename, join} from 'path';
import {produce} from 'immer';

import {RunnerTasks} from '../runner';
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

export default function differentialServing(tasks: RunnerTasks) {
  tasks.build.tap(PLUGIN, ({hooks}) => {
    hooks.webApp.tap(PLUGIN, ({hooks}) => {
      hooks.variants.tap(PLUGIN, (variants) =>
        Object.keys(BROWSER_TARGETS).flatMap((browserTarget) =>
          variants.map((build) => ({
            ...build,
            browserTarget: browserTarget as WebAppBuildOptions['browserTarget'],
          })),
        ),
      );

      hooks.configure.tap(PLUGIN, (configuration, {browserTarget}) => {
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
