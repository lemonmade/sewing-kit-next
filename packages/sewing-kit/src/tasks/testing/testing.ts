import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';

import {Runner} from '../../runner';
import {Workspace, Package, WebApp} from '../../workspace';

import {
  TestTaskHooks,
  TestTaskOptions,
  RootConfigurationHooks,
  PackageTestHooks,
  WebAppTestHooks,
} from './types';

export async function runTests(
  options: TestTaskOptions,
  workspace: Workspace,
  runner: Runner,
) {
  process.env.BABEL_ENV = 'test';
  process.env.NODE_ENV = 'test';

  const hooks: TestTaskHooks = {
    configure: new AsyncSeriesHook(['configurationHooks']),
    preSteps: new AsyncSeriesWaterfallHook(['steps']),
    postSteps: new AsyncSeriesWaterfallHook(['steps']),
    steps: new AsyncSeriesWaterfallHook(['steps']),
    project: new AsyncSeriesHook(['projectWithHooks']),
    package: new AsyncSeriesHook(['packageWithHooks']),
    webApp: new AsyncSeriesHook(['webAppWithHooks']),
  };

  await runner.tasks.test.promise({hooks, workspace, options});

  const rootConfigHooks: RootConfigurationHooks = {};

  await hooks.configure.promise(rootConfigHooks);

  await Promise.all(
    workspace.projects.map(async (project) => {
      if (project instanceof Package) {
        const packageHooks: PackageTestHooks = {
          configure: new AsyncSeriesHook(['configHooks']),
        };

        await hooks.project.promise({project, hooks: packageHooks});
        await hooks.package.promise({pkg: project, hooks: packageHooks});
        await packageHooks.configure.promise({});
      } else if (project instanceof WebApp) {
        const webAppHooks: WebAppTestHooks = {
          configure: new AsyncSeriesHook(['configHooks']),
        };

        await hooks.project.promise({project, hooks: webAppHooks});
        await hooks.webApp.promise({webApp: project, hooks: webAppHooks});
        await webAppHooks.configure.promise({});
      }
    }),
  );

  const preSteps = await hooks.preSteps.promise([]);
  const steps = await hooks.steps.promise([]);
  const postSteps = await hooks.postSteps.promise([]);

  await runner.run(steps, {pre: preSteps, post: postSteps});
}
