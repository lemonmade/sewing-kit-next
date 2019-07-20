import {loadWork} from '../work';

export async function test() {
  const work = await loadWork();

  const {WorkspaceDiscovery} = await import('../tasks/discovery');
  const {TestTask} = await import('../tasks/testing');

  const discovery = new WorkspaceDiscovery(process.cwd());
  await work.tasks.discovery.promise(discovery);
  const workspace = await discovery.run();

  const test = new TestTask(workspace);
  await work.tasks.test.promise(test, workspace);
  await test.run();
}
