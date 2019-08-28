import {createCommand} from './common';

export const dev = createCommand(
  {'--source-maps': Boolean},
  async ({'--source-maps': sourceMaps}, workspace, runner) => {
    const {runDev} = await import('@sewing-kit/core');
    await runDev({sourceMaps}, workspace, runner);
  },
);
