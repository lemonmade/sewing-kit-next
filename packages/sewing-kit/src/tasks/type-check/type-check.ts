import exec, {ExecaError} from 'execa';

import {Work} from '../../work';
import {Workspace} from '../../workspace';
import {TypeCheckOptions} from './types';

export async function runTypeCheck(
  options: TypeCheckOptions,
  _workspace: Workspace,
  _work: Work,
) {
  const {heap} = options;

  const heapArguments = heap ? [`--max-old-space-size=${heap}`] : [];

  try {
    const result = await exec('node', [
      ...heapArguments,
      'node_modules/.bin/tsc',
      '--build',
    ]);

    // eslint-disable-next-line no-console
    console.log(result.all);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log((error as ExecaError).all);
    process.exitCode = 1;
  }
}
