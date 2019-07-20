import {produce} from 'immer';
import {TestTask} from '../../tasks/testing';
import {PLUGIN} from './common';

export default function testJavaScript(test: TestTask) {
  test.configure.common.tap(PLUGIN, (configuration) => {
    configuration.extensions.tap(
      PLUGIN,
      produce((extensions: string[]) => {
        extensions.unshift('.mjs', '.js');
      }),
    );

    configuration.babel.tap(PLUGIN, (babelConfig) => {
      return produce(babelConfig, (babelConfig) => {
        babelConfig.presets = babelConfig.presets || [];
        babelConfig.presets.push([
          'babel-preset-shopify/node',
          {modules: 'commonjs'},
        ]);
      });
    });

    configuration.transforms.tap(PLUGIN, (transforms, {babelTransform}) => {
      return produce(transforms, (transforms) => {
        transforms['^.+\\.[m|j]s$'] = babelTransform;
      });
    });
  });
}
