import {createCommand} from './common';

export const lint = createCommand(
  {
    '--fix': Boolean,
    '--focus': [String],
  },
  async ({'--fix': fix}, workspace, runner) => {
    const {runLint} = await import('@sewing-kit/core');
    await runLint({fix}, workspace, runner);
  },
);
