import {createCommand} from './common';

export const typeCheck = createCommand(
  {
    '--watch': Boolean,
    '--heap': [String],
  },
  async ({'--watch': watch, '--heap': heap}, workspace, runner) => {
    const {runTypeCheck} = await import('../tasks/type-check');
    await runTypeCheck({watch, heap}, workspace, runner);
  },
);
