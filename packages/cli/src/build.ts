import {createCommand} from './common';

export const build = createCommand({}, async (_, workspace, runner) => {
  const {Env} = await import('@sewing-kit/types');
  const {runBuild} = await import('@sewing-kit/core');
  await runBuild(
    {env: Env.Development, simulateEnv: Env.Development},
    workspace,
    runner,
  );
});
