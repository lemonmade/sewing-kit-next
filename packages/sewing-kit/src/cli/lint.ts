import {createCommand} from './common';

export const lint = createCommand(
  {
    '--fix': Boolean,
    '--focus': [String],
  },
  async ({'--fix': fix}, workspace, work) => {
    const {runLint} = await import('../tasks/lint');
    await runLint({fix}, workspace, work);
  },
);
