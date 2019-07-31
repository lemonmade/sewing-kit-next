import {produce} from 'immer';
import {TestTask} from '../../tasks/testing';
import {PLUGIN} from './common';

export default function testJavaScript({hooks}: TestTask) {
  hooks.configureProject.tap(PLUGIN, ({hooks}) => {
    hooks.extensions.tap(
      PLUGIN,
      produce((extensions: string[]) => {
        // Unfortunately, some packages (like `graphql`) use `.mjs` for esmodule
        // versions of the file, which Jest can't parse. To avoid transforming
        // those otherwise-fine files, we prefer .js for tests only.
        extensions.unshift('.js', '.mjs');
      }),
    );

    hooks.babel.tap(PLUGIN, (babelConfig) => {
      return produce(babelConfig, (babelConfig) => {
        babelConfig.presets = babelConfig.presets || [];
        babelConfig.presets.push([
          'babel-preset-shopify/node',
          {modules: 'commonjs'},
        ]);
      });
    });

    hooks.jestTransforms.tap(PLUGIN, (transforms, {babelTransform}) => {
      return produce(transforms, (transforms) => {
        transforms['^.+\\.[m|j]s$'] = babelTransform;
      });
    });
  });
}
