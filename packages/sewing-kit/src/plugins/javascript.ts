import {produce} from 'immer';

import {Work} from '../work';

const PLUGIN = 'SewingKit.javascript';

export default function javascript(work: Work) {
  work.hooks.build.tap(PLUGIN, (build) => {
    build.hooks.extensions.tap(
      PLUGIN,
      produce((extensions: string[]) => {
        extensions.unshift('.js', '.jsx', '.mjs');
      }),
    );

    build.hooks.rules.tapPromise(PLUGIN, async (rules, target) => {
      const options = await build.configuration.hooks.babel.promise(
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
}
