import {produce} from 'immer';

import {Work} from '../work';

const PLUGIN = 'SewingKit.javascript';

export default function javascript(work: Work) {
  work.tasks.build.tap(PLUGIN, (build) => {
    build.configure.common.tap(PLUGIN, (configuration) => {
      configuration.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift('.js', '.jsx', '.mjs');
        }),
      );

      configuration.webpackRules.tapPromise(PLUGIN, async (rules, target) => {
        const options = await configuration.babel.promise(
          {presets: []},
          target,
        );

        return produce(rules, (rules) => {
          rules.push({
            test: /\.m?jsx?/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options,
          });
        });
      });
    });
  });
}
