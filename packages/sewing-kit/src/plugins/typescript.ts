import {produce} from 'immer';
import {Work} from '../work';
import {updateBabelPreset} from './utilities';

const PLUGIN = 'SewingKit.typescript';

export default function typescript(work: Work) {
  work.tasks.test.tap(PLUGIN, (test) => {
    test.configure.common.tap(PLUGIN, (configuration) => {
      configuration.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift('.ts', '.tsx');
        }),
      );
    });
  });

  work.tasks.build.tap(PLUGIN, (buildTask) => {
    buildTask.configure.common.tap(PLUGIN, (configuration) => {
      configuration.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift('.ts', '.tsx');
        }),
      );

      configuration.babel.tap(PLUGIN, (babelConfig) => {
        return produce(
          babelConfig,
          updateBabelPreset(
            [
              'babel-preset-shopify',
              'babel-preset-shopify/web',
              'babel-preset-shopify/node',
            ],
            {typescript: true},
          ),
        );
      });

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
