import {produce} from 'immer';
import {Work, BabelConfig} from '../concepts';

export default function typescript(work: Work) {
  work.hooks.configure.tap('SewingKit.typescript', (configuration) => {
    configuration.hooks.babel.tap(
      'SewingKit.typescript',
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
  });

  work.hooks.build.tap('SewingKit.typescript', (build) => {
    build.hooks.extensions.tap(
      'SewingKit.typescript',
      produce((extensions: string[]) => {
        extensions.unshift('.ts', '.tsx');
      }),
    );

    build.hooks.rules.tapPromise('SewingKit.typescript', async (rules) => {
      const options = await build.configuration.hooks.babel.promise({
        presets: [],
      });

      return produce(rules, (rules) => {
        rules.push({
          test: /\.tsx?/,
          loader: 'babel-loader',
          options,
        });
      });
    });
  });
}
