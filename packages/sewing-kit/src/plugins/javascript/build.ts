import {produce} from 'immer';
import {BuildTask} from '../../tasks/build';
import {PLUGIN} from './common';

export default function buildJavaScript(build: BuildTask) {
  build.configure.common.tap(PLUGIN, (configuration) => {
    configuration.extensions.tap(
      PLUGIN,
      produce((extensions: string[]) => {
        extensions.unshift('.js', '.mjs');
      }),
    );

    configuration.babel.tap(PLUGIN, (babelPlugin) => {
      return produce(babelPlugin, (babelPlugin) => {
        babelPlugin.presets.push('babel-preset-shopify');
      });
    });

    configuration.webpackRules.tapPromise(PLUGIN, async (rules, target) => {
      const options = await configuration.babel.promise({presets: []}, target);

      return produce(rules, (rules) => {
        rules.push({
          test: /\.m?js/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options,
        });
      });
    });
  });
}
