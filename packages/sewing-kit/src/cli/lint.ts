import {createCommand} from './common';

export const lint = createCommand(
  {
    '--fix': Boolean,
    '--focus': [String],
  },
  async ({'--fix': fix}, workspace, work) => {
    const {LintTask} = await import('../tasks/lint');

    const lint = new LintTask({fix}, workspace);
    await work.tasks.lint.promise(workspace, lint);
    await lint.run();
  },
);
