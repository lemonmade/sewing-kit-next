import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';

import {Runner} from '../../runner';
import {Workspace} from '../../workspace';
import {TypeCheckOptions, TypeCheckTaskHooks} from './types';

export async function runTypeCheck(
  options: TypeCheckOptions,
  workspace: Workspace,
  runner: Runner,
) {
  const hooks: TypeCheckTaskHooks = {
    configure: new AsyncSeriesHook(['configurationHooks']),
    pre: new AsyncSeriesWaterfallHook(['steps']),
    steps: new AsyncSeriesWaterfallHook(['steps']),
    post: new AsyncSeriesWaterfallHook(['steps']),
  };

  await runner.tasks.typeCheck.promise({
    hooks,
    options,
    workspace,
  });

  await hooks.configure.promise({});

  const pre = await hooks.pre.promise([]);
  const steps = await hooks.steps.promise([]);
  const post = await hooks.post.promise([]);

  await runner.run(steps, {title: 'type-check', pre, post});
}
