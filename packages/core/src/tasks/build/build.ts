import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  Step,
  BuildWebAppHooks,
  BuildBrowserConfigurationHooks,
  BuildPackageHooks,
  BuildPackageConfigurationHooks,
} from '@sewing-kit/types';
import {run, createStep} from '@sewing-kit/ui';

import {Workspace} from '../../workspace';
import {Runner} from '../../runner';

import {BuildTaskOptions, BuildTaskHooks} from './types';

export async function runBuild(
  options: BuildTaskOptions,
  workspace: Workspace,
  runner: Runner,
) {
  const buildTaskHooks: BuildTaskHooks = {
    configure: new AsyncSeriesHook(['hooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'details']),

    project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
    package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
    webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),

    post: new AsyncSeriesWaterfallHook(['steps', 'details']),
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
        return createStep({label: `Building variant`}, async (step) => {
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

          await step.run(steps);
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
            async (step) => {
              const steps = variants.map((variant) =>
                createStep(
                  {
                    label: (fmt) =>
                      fmt`Build {emphasis ${Object.keys(variant)[0]}} variant`,
                  },
                  async (step) => {
                    const configurationHooks: BuildPackageConfigurationHooks = {
                      extensions: new AsyncSeriesWaterfallHook(['extensions']),
                    };

                    await hooks.configure.promise(configurationHooks, variant);

                    const steps = await hooks.steps.promise([], {
                      variant,
                      config: configurationHooks,
                    });

                    await step.run(steps);
                  },
                ),
              );

              await step.run(steps);
            },
          );
        }),
      );

  const configurationHooks = {};
  await buildTaskHooks.configure.promise(configurationHooks);

  const [pre, post] = await Promise.all([
    buildTaskHooks.pre.promise([], {configuration: configurationHooks}),
    buildTaskHooks.post.promise([], {configuration: configurationHooks}),
  ]);

  await run([...webAppSteps, ...packageSteps], {ui: runner.ui, pre, post});
}
