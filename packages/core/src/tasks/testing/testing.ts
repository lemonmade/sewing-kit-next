import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {run} from '@sewing-kit/ui';

import {Runner} from '../../runner';
import {Workspace, Package, WebApp} from '../../workspace';

import {
  TestTaskHooks,
  TestTaskOptions,
  TestPackageHooks,
  TestWebAppHooks,
} from './types';

export async function runTests(
  options: TestTaskOptions,
  workspace: Workspace,
  runner: Runner,
) {
  const hooks: TestTaskHooks = {
    configure: new AsyncSeriesHook(['configurationHooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    post: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    steps: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    project: new AsyncSeriesHook(['projectWithHooks']),
    package: new AsyncSeriesHook(['packageWithHooks']),
    webApp: new AsyncSeriesHook(['webAppWithHooks']),
  };

  await runner.tasks.test.promise({hooks, workspace, options});

  const rootConfigHooks = {};
  await hooks.configure.promise(rootConfigHooks);

  await Promise.all(
    workspace.projects.map(async (project) => {
      if (project instanceof Package) {
        const packageHooks: TestPackageHooks = {
          configure: new AsyncSeriesHook(['configHooks']),
        };

        await hooks.project.promise({project, hooks: packageHooks});
        await hooks.package.promise({pkg: project, hooks: packageHooks});
        await packageHooks.configure.promise({});
      } else if (project instanceof WebApp) {
        const webAppHooks: TestWebAppHooks = {
          configure: new AsyncSeriesHook(['configHooks']),
        };

        await hooks.project.promise({project, hooks: webAppHooks});
        await hooks.webApp.promise({webApp: project, hooks: webAppHooks});
        await webAppHooks.configure.promise({});
      }
    }),
  );

  const stepDetails = {configuration: rootConfigHooks};
  const pre = await hooks.pre.promise([], stepDetails);
  const steps = await hooks.steps.promise([], stepDetails);
  const post = await hooks.post.promise([], stepDetails);

  await run(steps, {ui: runner.ui, pre, post});
}
