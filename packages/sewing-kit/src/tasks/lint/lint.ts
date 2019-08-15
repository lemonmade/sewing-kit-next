import {AsyncSeriesHook, AsyncSeriesWaterfallHook} from 'tapable';

import {Workspace} from '../../workspace';
import {Runner} from '../../runner';
import {LintTaskOptions, LintTaskHooks} from './types';

export async function runLint(
  options: LintTaskOptions,
  workspace: Workspace,
  runner: Runner,
) {
  const hooks: LintTaskHooks = {
    configure: new AsyncSeriesHook(['configurationHooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    steps: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    post: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
  };

  await runner.tasks.lint.promise({
    hooks,
    options,
    workspace,
  });

  const configurationHooks = {};
  await hooks.configure.promise(configurationHooks);

  const pre = await hooks.pre.promise([], {configuration: configurationHooks});
  const steps = await hooks.steps.promise([], {
    configuration: configurationHooks,
  });
  const post = await hooks.post.promise([], {
    configuration: configurationHooks,
  });

  await runner.run(steps, {title: 'lint', pre, post});
}
