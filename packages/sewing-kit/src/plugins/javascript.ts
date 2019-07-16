import {produce} from 'immer';

import {Work} from '../work';

const PLUGIN = 'SewingKit.javascript';

export default function javascript(work: Work) {
  work.tasks.build.tap(PLUGIN, (build) => {
    build.webpack.browser.tap(PLUGIN, (browserBuild) => {
      browserBuild.hooks.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift('.js', '.jsx', '.mjs');
        }),
      );

      browserBuild.hooks.rules.tapPromise(PLUGIN, async (rules, target) => {
        const options = await browserBuild.configuration.hooks.babel.promise(
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
