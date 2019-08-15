import {createCommand} from './common';

export const test = createCommand(
  {
    '--help': Boolean,
    '--no-watch': Boolean,
    '--coverage': Boolean,
    '--debug': Boolean,
    '--update-snapshot': Boolean,
    '--max-workers': Number,
    '--test-name-pattern': String,
    '--pre': Boolean,
  },
  async (
    {
      _: [testPattern],
      '--debug': debug,
      '--coverage': coverage,
      '--max-workers': maxWorkers,
      '--pre': pre,
      '--test-name-pattern': testNamePattern,
      '--update-snapshot': updateSnapshot,
      '--no-watch': noWatch,
    },
    workspace,
    runner,
  ) => {
    const {runTests} = await import('@sewing-kit/core');

    await runTests(
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
      runner,
    );
  },
);
