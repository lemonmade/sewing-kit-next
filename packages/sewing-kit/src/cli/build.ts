import {Env} from '../types';
import {loadWork} from './common';

export async function build({root = process.cwd()} = {}) {
  const work = await loadWork();

  const {WorkspaceDiscovery} = await import('../tasks/discovery');
  const {runBuild} = await import('../tasks/build');

  const discovery = new WorkspaceDiscovery(root);
  await work.tasks.discovery.promise(discovery);
  const workspace = await discovery.run();

  const options = {env: Env.Development, simulateEnv: Env.Development};
  await runBuild(options, workspace, work);
}
