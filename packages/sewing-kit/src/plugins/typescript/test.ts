import {produce} from 'immer';
import {TestTask} from '../../tasks/testing';
import {updateBabelPreset} from '../utilities';
import {PLUGIN} from './common';

export default function testTypeScript({hooks}: TestTask) {
  hooks.project.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (hooks) => {
      if (hooks.jestExtensions && hooks.jestTransforms) {
        hooks.jestExtensions.tap(PLUGIN, (extensions) => [
          '.ts',
          '.tsx',
          ...extensions,
        ]);

        hooks.jestTransforms.tap(PLUGIN, (transforms, {babelTransform}) => {
          return produce(transforms, (transforms) => {
            transforms['^.+\\.tsx?$'] = babelTransform;
          });
        });
      }

      if (hooks.babelConfig) {
        hooks.babelConfig.tap(PLUGIN, (babelConfig) => {
          return produce(
            babelConfig,
            updateBabelPreset('babel-preset-shopify/node', {typescript: true}),
          );
        });
      }
    });
  });
}
