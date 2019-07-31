import {produce} from 'immer';
import {TestTask} from '../../tasks/testing';
import {updateBabelPreset} from '../utilities';
import {PLUGIN} from './common';

export default function testTypeScript({hooks}: TestTask) {
  hooks.configureProject.tap(PLUGIN, ({hooks}) => {
    hooks.extensions.tap(PLUGIN, (extensions) => [
      '.ts',
      '.tsx',
      ...extensions,
    ]);

    hooks.babel.tap(PLUGIN, (babelConfig) => {
      return produce(
        babelConfig,
        updateBabelPreset('babel-preset-shopify/node', {typescript: true}),
      );
    });

    hooks.jestTransforms.tap(PLUGIN, (transforms, {babelTransform}) => {
      return produce(transforms, (transforms) => {
        transforms['^.+\\.tsx?$'] = babelTransform;
      });
    });
  });
}
