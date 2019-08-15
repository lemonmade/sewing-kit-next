import {createCommand} from './common';

export const build = createCommand({}, async (_, workspace, runner) => {
  const {runBuild, Env} = await import('@sewing-kit/core');
  await runBuild(
    {env: Env.Development, simulateEnv: Env.Development},
    workspace,
    runner,
  );
});
