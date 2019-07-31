import {createCommand} from './common';

export const test = createCommand(
  {
    '--help': Boolean,
    '--noWatch': Boolean,
    '--coverage': Boolean,
    '--debug': Boolean,
    '--updateSnapshot': Boolean,
    '--maxWorkers': Number,
    '--testNamePattern': String,
    '--pre': Boolean,
  },
  async (
    {
      _: [testPattern],
      '--debug': debug,
      '--coverage': coverage,
      '--maxWorkers': maxWorkers,
      '--pre': pre,
      '--testNamePattern': testNamePattern,
      '--updateSnapshot': updateSnapshot,
      '--noWatch': noWatch,
    },
    workspace,
    work,
  ) => {
    const {TestTask} = await import('../tasks/testing');

    const test = new TestTask(
      {
        debug,
        coverage,
        maxWorkers,
        pre,
        testPattern,
        testNamePattern,
        updateSnapshot,
        watch: noWatch == null ? noWatch : !noWatch,
      },
      workspace,
    );

    await work.tasks.test.promise(workspace, test);
    await test.run();
  },
);
