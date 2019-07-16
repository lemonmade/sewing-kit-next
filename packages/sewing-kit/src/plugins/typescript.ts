import {produce} from 'immer';

import {Work} from '../work';
import {BabelConfig} from '../build';

const PLUGIN = 'SewingKit.typescript';

export default function typescript(work: Work) {
  work.hooks.build.tap(PLUGIN, (build) => {
    build.hooks.extensions.tap(
      PLUGIN,
      produce((extensions: string[]) => {
        extensions.unshift('.ts', '.tsx');
      }),
    );

    build.configuration.hooks.babel.tap(
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

    build.hooks.rules.tapPromise(PLUGIN, async (rules, target) => {
      const options = await build.configuration.hooks.babel.promise(
        {
          presets: [],
        },
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
}
