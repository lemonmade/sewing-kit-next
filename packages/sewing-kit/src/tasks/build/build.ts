import webpack, {Configuration as WebpackConfiguration} from 'webpack';
import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';

import {Env} from '../../types';
import {Workspace} from '../../workspace';
import {Work} from '../../work';

import {
  Step,
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
  work: Work,
) {
  const buildTaskHooks: BuildTaskHooks = {
    pre: new AsyncSeriesWaterfallHook(['steps']),

    project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
    package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
    webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),

    post: new AsyncSeriesWaterfallHook(['steps']),
  };

  await work.tasks.build.promise({
    hooks: buildTaskHooks,
    options,
    workspace,
  });

  const webAppSteps: Step[] = (await Promise.all(
    workspace.webApps.map(async (webApp) => {
      const hooks: WebAppBuildHooks = {
        variants: new AsyncSeriesWaterfallHook(['variants']),
        steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
        configure: new AsyncSeriesHook(['configuration', 'options']),
        configureBrowser: new AsyncSeriesHook(['configuration', 'options']),
        configureServiceWorker: new AsyncSeriesHook([
          'configuration',
          'options',
        ]),
      };

      await buildTaskHooks.project.promise({project: webApp, hooks});
      await buildTaskHooks.webApp.promise({webApp, hooks});

      const variants = await hooks.variants.promise([]);

      return variants.map((variant) => {
        return {
          async run() {
            const configurationHooks: BrowserBuildConfigurationHooks = {
              babel: new AsyncSeriesWaterfallHook(['babelConfig']),
              entries: new AsyncSeriesWaterfallHook(['entries']),
              extensions: new AsyncSeriesWaterfallHook([
                'extensions',
                'options',
              ]),
              filename: new AsyncSeriesWaterfallHook(['filename']),
              output: new AsyncSeriesWaterfallHook(['output']),
              webpackRules: new AsyncSeriesWaterfallHook(['rules']),
              webpackConfig: new AsyncSeriesWaterfallHook(['webpackConfig']),
            };

            await hooks.configure.promise(configurationHooks, variant);
            await hooks.configureBrowser.promise(configurationHooks, variant);

            const rules = await configurationHooks.webpackRules.promise([]);
            const extensions = await configurationHooks.extensions.promise([]);
            const outputPath = await configurationHooks.output.promise(
              workspace.fs.buildPath(),
            );
            const filename = await configurationHooks.filename.promise(
              '[name].js',
            );

            const webpackConfig = await configurationHooks.webpackConfig.promise(
              {
                entry: await configurationHooks.entries.promise([webApp.entry]),
                mode: toMode(options.simulateEnv),
                resolve: {extensions},
                module: {rules},
                output: {
                  path: outputPath,
                  filename,
                },
              },
            );

            await buildWebpack(webpackConfig);
          },
        };
      });
    }),
  )).flat();

  const packageSteps: Step[] = (await Promise.all(
    workspace.packages.map(async (pkg) => {
      const hooks: PackageBuildHooks = {
        variants: new AsyncSeriesWaterfallHook(['variants']),
        steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
        configure: new AsyncSeriesHook(['buildTarget', 'options']),
      };

      await buildTaskHooks.project.promise({project: pkg, hooks});
      await buildTaskHooks.package.promise({pkg, hooks});

      const variants = await hooks.variants.promise([]);

      return variants.map((variant) => {
        return {
          async run() {
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

            for (const step of steps) {
              await step.run();
            }
          },
        };
      });
    }),
  )).flat();

  await Promise.all(
    [...webAppSteps, ...packageSteps].map((step) => step.run()),
  );
}

function toMode(env: Env) {
  switch (env) {
    case Env.Production:
    case Env.Staging:
      return 'production';
    default:
      return 'development';
  }
}

function buildWebpack(config: WebpackConfiguration) {
  const compiler = webpack(config);

  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        reject(new Error(stats.toString('errors-warnings')));
        return;
      }

      resolve();
    });
  });
}
