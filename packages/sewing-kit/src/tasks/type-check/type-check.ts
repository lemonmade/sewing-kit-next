import exec from 'execa';

import {Runner, createStep, DiagnosticError} from '../../runner';
import {Workspace} from '../../workspace';
import {TypeCheckOptions} from './types';

export async function runTypeCheck(
  options: TypeCheckOptions,
  workspace: Workspace,
  runner: Runner,
) {
  await runner.tasks.typeCheck.promise({
    hooks: {},
    options,
    workspace,
  });

  const {heap} = options;
  const heapArguments = heap ? [`--max-old-space-size=${heap}`] : [];

  await runner.run([
    createStep(async (ui) => {
      try {
        const result = await exec('node', [
          ...heapArguments,
          'node_modules/.bin/tsc',
          '--build',
          '--pretty',
        ]);

        ui.log(result.all.trim() || 'Type check completed successfully.');
      } catch (error) {
        throw new DiagnosticError({
          message: error.all,
        });
      }
    }),
  ]);
}
