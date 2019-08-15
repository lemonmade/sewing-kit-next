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
    pre: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    steps: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    post: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
  };

  await runner.tasks.typeCheck.promise({
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

  await runner.run(steps, {title: 'type-check', pre, post});
}
