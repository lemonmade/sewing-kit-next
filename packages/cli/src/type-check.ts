import {createCommand} from './common';

export const typeCheck = createCommand(
  {
    '--watch': Boolean,
    '--heap': [String],
  },
  async ({'--watch': watch, '--heap': heap}, workspace, runner) => {
    const {runTypeCheck} = await import('@sewing-kit/core');
    await runTypeCheck({watch, heap}, workspace, runner);
  },
);
