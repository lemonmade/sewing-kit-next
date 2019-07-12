import {produce} from 'immer';
import {Work, BabelConfig} from '../concepts';

export default function web(work: Work) {
  work.hooks.configure.tap('SewingKit.web', (configuration) => {
    configuration.hooks.babel.tap(
      'SewingKit.web',
      produce((babelConfig: BabelConfig) => {
        babelConfig.presets.push([
          'babel-preset-shopify/web',
          {modules: false},
        ]);
      }),
    );
  });
}
