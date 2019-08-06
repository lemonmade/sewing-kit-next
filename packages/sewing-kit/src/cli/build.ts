import {Env} from '../types';
import {createCommand} from './common';

export const build = createCommand({}, async (_, workspace, runner) => {
  const {runBuild} = await import('../tasks/build');
  await runBuild(
    {env: Env.Development, simulateEnv: Env.Development},
    workspace,
    runner,
  );
});
