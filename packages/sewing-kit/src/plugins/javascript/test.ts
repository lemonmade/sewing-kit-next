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

    configuration.transforms.tap(PLUGIN, (transforms) => {
      return produce(transforms, (transforms) => {
        transforms['^.+\\.[m|j]s$'] = require.resolve(
          './transforms/javascript',
        );
      });
    });
  });
}
