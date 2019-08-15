import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {run, Step, createStep} from '@sewing-kit/ui';

import {Workspace} from '../../workspace';
import {Runner} from '../../runner';

import {
  BuildTaskOptions,
  BuildTaskHooks,
  BuildPackageHooks,
  BuildPackageConfigurationHooks,
  BuildWebAppHooks,
  BuildBrowserConfigurationHooks,
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
      const hooks: BuildWebAppHooks = {
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
        return createStep({label: `Building variant`}, async (_, runner) => {
          const configurationHooks: BuildBrowserConfigurationHooks = {
            entries: new AsyncSeriesWaterfallHook(['entries']),
            extensions: new AsyncSeriesWaterfallHook(['extensions', 'options']),
            filename: new AsyncSeriesWaterfallHook(['filename']),
            output: new AsyncSeriesWaterfallHook(['output']),
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
          const hooks: BuildPackageHooks = {
            variants: new AsyncSeriesWaterfallHook(['variants']),
            steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
            configure: new AsyncSeriesHook(['buildTarget', 'options']),
          };

          await buildTaskHooks.project.promise({project: pkg, hooks});
          await buildTaskHooks.package.promise({pkg, hooks});

          const variants = await hooks.variants.promise([]);

          return createStep(
            {label: (fmt) => fmt`Build package {emphasis ${pkg.name}}`},
            async (_ui, runner) => {
              const steps = variants.map((variant) =>
                createStep(
                  {
                    label: (fmt) =>
                      fmt`Build {code ${Object.keys(variant)[0]}} variant`,
                  },
                  async (_, runner) => {
                    const configurationHooks: BuildPackageConfigurationHooks = {
                      output: new AsyncSeriesWaterfallHook(['output']),
                      extensions: new AsyncSeriesWaterfallHook(['extensions']),
                    };

                    await hooks.configure.promise(configurationHooks, variant);

                    const steps = await hooks.steps.promise([], {
                      variant,
                      config: configurationHooks,
                    });

                    await runner.run(steps);
                  },
                ),
              );

              await runner.run(steps);
            },
          );
        }),
      );

  await run([...webAppSteps, ...packageSteps], {ui: runner.ui});
}
