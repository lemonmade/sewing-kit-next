import arg from 'arg';
import {loadWork, Options} from './common';

export async function lint({root = process.cwd(), argv}: Options) {
  const work = await loadWork();

  const {WorkspaceDiscovery} = await import('../tasks/discovery');
  const {LintTask} = await import('../tasks/lint');

  const discovery = new WorkspaceDiscovery(root);
  await work.tasks.discovery.promise(discovery);
  const workspace = await discovery.run();

  const args = arg(
    {
      '--fix': Boolean,
      '--focus': [String],
    },
    {argv},
  );

  const {'--fix': fix} = args;

  const options = {fix};
  const lint = new LintTask(options, workspace);
  await work.tasks.lint.promise(lint);
  await lint.run();
}
