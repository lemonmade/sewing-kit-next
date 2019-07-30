import arg from 'arg';
import {loadWork, Options} from './common';

export async function test({argv}: Options) {
  const work = await loadWork();

  const args = arg(
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
    {argv},
  );

  const {
    _: [testPattern],
    '--debug': debug,
    '--coverage': coverage,
    '--maxWorkers': maxWorkers,
    '--pre': pre,
    '--testNamePattern': testNamePattern,
    '--updateSnapshot': updateSnapshot,
    '--noWatch': noWatch,
  } = args;

  const {WorkspaceDiscovery} = await import('../tasks/discovery');
  const {TestTask} = await import('../tasks/testing');

  const discovery = new WorkspaceDiscovery(process.cwd());
  await work.tasks.discovery.promise(discovery);
  const workspace = await discovery.run();

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
}
