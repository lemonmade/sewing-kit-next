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
    pre: new AsyncSeriesWaterfallHook(['steps']),
    steps: new AsyncSeriesWaterfallHook(['steps']),
    post: new AsyncSeriesWaterfallHook(['steps']),
  };

  await runner.tasks.lint.promise({
    hooks,
    options,
    workspace,
  });

  await hooks.configure.promise({});

  const pre = await hooks.pre.promise([]);
  const steps = await hooks.steps.promise([]);
  const post = await hooks.post.promise([]);

  await runner.run(steps, {title: 'lint', pre, post});
}
