import {produce} from 'immer';

import {Work} from '../work';
import {BabelConfig} from '../build';

const PLUGIN = 'SewingKit.typescript';

export default function typescript(work: Work) {
  work.tasks.build.tap(PLUGIN, (buildTask) => {
    buildTask.configure.common.tap(PLUGIN, (configuration) => {
      configuration.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift('.ts', '.tsx');
        }),
      );

      configuration.babel.tap(
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

      configuration.webpackRules.tapPromise(PLUGIN, async (rules) => {
        const options = await configuration.babel.promise({
          presets: [],
        });

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
