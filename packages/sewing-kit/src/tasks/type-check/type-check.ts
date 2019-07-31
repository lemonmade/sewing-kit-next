import exec from 'execa';

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

  await exec('node', [
    ...heapArguments,
    'node_modules/.bin/tsc',
    '--noEmit',
    '--pretty',
  ]);
}
