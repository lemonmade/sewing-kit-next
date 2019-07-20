import {produce} from 'immer';
import {TestTask} from '../../tasks/testing';
import {updateBabelPreset} from '../utilities';
import {PLUGIN} from './common';

export default function testTypeScript(test: TestTask) {
  test.configure.common.tap(PLUGIN, (configuration) => {
    configuration.extensions.tap(
      PLUGIN,
      produce((extensions: string[]) => {
        extensions.unshift('.ts', '.tsx');
      }),
    );

    configuration.babel.tap(PLUGIN, (babelConfig) => {
      return produce(
        babelConfig,
        updateBabelPreset('babel-preset-shopify/node', {typescript: true}),
      );
    });

    configuration.transforms.tap(PLUGIN, (transforms, {babelTransform}) => {
      return produce(transforms, (transforms) => {
        transforms['^.+\\.tsx?$'] = babelTransform;
      });
    });
  });
}
