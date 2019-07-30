import {produce} from 'immer';
import {Workspace} from '../../workspace';
import {TestTask} from '../../tasks/testing';
import {PLUGIN} from './common';

export default function testJavaScript(_: Workspace, test: TestTask) {
  test.configure.common.tap(PLUGIN, (configuration) => {
    configuration.extensions.tap(
      PLUGIN,
      produce((extensions: string[]) => {
        // Unfortunately, some packages (like `graphql`) use `.mjs` for esmodule
        // versions of the file, which Jest can't parse. To avoid transforming
        // those otherwise-fine files, we prefer .js for tests only.
        extensions.unshift('.js', '.mjs');
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

    configuration.jestTransforms.tap(PLUGIN, (transforms, {babelTransform}) => {
      return produce(transforms, (transforms) => {
        transforms['^.+\\.[m|j]s$'] = babelTransform;
      });
    });
  });
}
