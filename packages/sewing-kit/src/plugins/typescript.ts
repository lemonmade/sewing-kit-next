import {produce} from 'immer';

import {Work} from '../work';
import {BabelConfig} from '../build';

const PLUGIN = 'SewingKit.typescript';

export default function typescript(work: Work) {
  work.tasks.build.tap(PLUGIN, (buildTask) => {
    buildTask.webpack.browser.tap(PLUGIN, (browserBuild) => {
      browserBuild.hooks.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift('.ts', '.tsx');
        }),
      );

      browserBuild.configuration.hooks.babel.tap(
        PLUGIN,
        produce((babelConfig: BabelConfig) => {
          for (const preset of babelConfig.presets) {
            if (
              Array.isArray(preset) &&
              (preset[0] === 'babel-preset-shopify/web' ||
                preset[0] === 'babel-preset-shopify/node')
            ) {
              preset[1] = preset[1] || {};
              preset[1].typescript = true;
            }
          }
        }),
      );

      browserBuild.hooks.rules.tapPromise(PLUGIN, async (rules, target) => {
        const options = await browserBuild.configuration.hooks.babel.promise(
          {presets: []},
          target,
        );

        return produce(rules, (rules) => {
          rules.push({
            test: /\.tsx?/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options,
          });
        });
      });
    });
  });
}
