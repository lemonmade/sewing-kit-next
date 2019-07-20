import {produce} from 'immer';
import {BuildTask} from '../../tasks/build';
import {updateBabelPreset} from '../utilities';
import {PLUGIN} from './common';

export default function buildTypeScript(build: BuildTask) {
  build.configure.common.tap(PLUGIN, (configuration) => {
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
}
