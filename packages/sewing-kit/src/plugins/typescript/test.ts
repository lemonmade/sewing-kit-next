import {produce} from 'immer';
import {TestTask} from '../../tasks/testing';
import {PLUGIN} from './common';

export default function testTypeScript(test: TestTask) {
  test.configure.common.tap(PLUGIN, (configuration) => {
    configuration.extensions.tap(
      PLUGIN,
      produce((extensions: string[]) => {
        extensions.unshift('.ts', '.tsx');
      }),
    );

    configuration.transforms.tap(PLUGIN, (transforms) => {
      return produce(transforms, (transforms) => {
        transforms['^.+\\.tsx?$'] = require.resolve('./transforms/jest');
      });
    });
  });
}
