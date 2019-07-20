import {loadWork} from '../work';
import {Env} from '../types';

export async function build() {
  const work = await loadWork();

  const {WorkspaceDiscovery} = await import('../tasks/discovery');
  const {BuildTask} = await import('../tasks/build');

  const discovery = new WorkspaceDiscovery(process.cwd());
  await work.tasks.discovery.promise(discovery);
  const workspace = await discovery.run();

  const env = {actual: Env.Development, simulate: Env.Development};
  const build = new BuildTask(env, workspace);
  await work.tasks.build.promise(build, workspace);
  await build.run();
}
