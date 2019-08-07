import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';

import {Workspace} from '../../workspace';
import {Runner, Step, createStep} from '../../runner';

import {
  BuildTaskOptions,
  BuildTaskHooks,
  PackageBuildHooks,
  PackageBuildConfigurationHooks,
  WebAppBuildHooks,
  BrowserBuildConfigurationHooks,
} from './types';

export async function runBuild(
  options: BuildTaskOptions,
  workspace: Workspace,
  runner: Runner,
) {
  const buildTaskHooks: BuildTaskHooks = {
    pre: new AsyncSeriesWaterfallHook(['steps']),

    project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
    package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
    webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),

    post: new AsyncSeriesWaterfallHook(['steps']),
  };

  await runner.tasks.build.promise({
    hooks: buildTaskHooks,
    options,
    workspace,
  });

  const webAppSteps: Step[] = (await Promise.all(
    workspace.webApps.map(async (webApp) => {
      const hooks: WebAppBuildHooks = {
        variants: new AsyncSeriesWaterfallHook(['variants']),
        steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
        configure: new AsyncSeriesHook(['configuration', 'variant']),
        configureBrowser: new AsyncSeriesHook(['configuration', 'variant']),
        configureServiceWorker: new AsyncSeriesHook([
          'configuration',
          'variant',
        ]),
      };

      await buildTaskHooks.project.promise({project: webApp, hooks});
      await buildTaskHooks.webApp.promise({webApp, hooks});

      const variants = await hooks.variants.promise([]);

      return variants.map((variant) => {
        return createStep(async (_, runner) => {
          const configurationHooks: BrowserBuildConfigurationHooks = {
            babel: new AsyncSeriesWaterfallHook(['babelConfig']),
            entries: new AsyncSeriesWaterfallHook(['entries']),
            extensions: new AsyncSeriesWaterfallHook(['extensions', 'options']),
            filename: new AsyncSeriesWaterfallHook(['filename']),
            output: new AsyncSeriesWaterfallHook(['output']),
            webpackRules: new AsyncSeriesWaterfallHook(['rules']),
            webpackConfig: new AsyncSeriesWaterfallHook(['webpackConfig']),
          };

          await hooks.configure.promise(configurationHooks, variant);
          await hooks.configureBrowser.promise(configurationHooks, variant);

          const steps = await hooks.steps.promise([], {
            variant,
            browserConfig: configurationHooks,
            serviceWorkerConfig: configurationHooks,
          });

          await runner.run(steps);
        });
      });
    }),
  )).flat();

  const packageSteps: Step[] = workspace.private
    ? []
    : await Promise.all(
        workspace.packages.map(async (pkg) => {
          const hooks: PackageBuildHooks = {
            variants: new AsyncSeriesWaterfallHook(['variants']),
            steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
            configure: new AsyncSeriesHook(['buildTarget', 'options']),
          };

          await buildTaskHooks.project.promise({project: pkg, hooks});
          await buildTaskHooks.package.promise({pkg, hooks});

          const variants = await hooks.variants.promise([]);

          return createStep(async (ui, runner) => {
            await ui.spin(`Building package ${pkg.name}`, async () => {
              const steps = variants.map((variant) =>
                createStep(async (_, runner) => {
                  const configurationHooks: PackageBuildConfigurationHooks = {
                    babel: new AsyncSeriesWaterfallHook(['babelConfig']),
                    output: new AsyncSeriesWaterfallHook(['output']),
                    extensions: new AsyncSeriesWaterfallHook(['extensions']),
                  };

                  await hooks.configure.promise(configurationHooks, variant);

                  const steps = await hooks.steps.promise([], {
                    variant,
                    config: configurationHooks,
                  });

                  await runner.run(steps);
                }),
              );

              await runner.run(steps);
            });
          });
        }),
      );

  await runner.run([...webAppSteps, ...packageSteps]);
}
