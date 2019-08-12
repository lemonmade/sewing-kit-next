import {AsyncSeriesWaterfallHook} from 'tapable';
import {RunnerTasks, createStep} from '../../runner';
import {addHooks, compose} from '../utilities';

const PLUGIN = 'SewingKit.jest';

declare module '../../tasks/testing/types' {
  interface ProjectConfigurationCustomHooks {
    readonly jestExtensions: AsyncSeriesWaterfallHook<string[]>;
    readonly jestEnvironment: AsyncSeriesWaterfallHook<string>;
    readonly jestModuleMapper: AsyncSeriesWaterfallHook<{
      [key: string]: string;
    }>;
    readonly jestSetupEnv: AsyncSeriesWaterfallHook<string[]>;
    readonly jestSetupTests: AsyncSeriesWaterfallHook<string[]>;
    readonly jestTransforms: AsyncSeriesWaterfallHook<
      {[key: string]: string},
      // TransformOptions
      {}
    >;
    readonly jestConfig: AsyncSeriesWaterfallHook<jest.InitialOptions>;
  }

  interface RootConfigurationCustomHooks {
    readonly jestSetupEnv: AsyncSeriesWaterfallHook<string[]>;
    readonly jestSetupTests: AsyncSeriesWaterfallHook<string[]>;
    readonly jestWatchIgnore: AsyncSeriesWaterfallHook<string[]>;
    readonly jestConfig: AsyncSeriesWaterfallHook<jest.InitialOptions>;
    readonly jestWatchPlugins: AsyncSeriesWaterfallHook<string[]>;
    readonly jestFlags: AsyncSeriesWaterfallHook<JestFlags>;
  }
}

const addProjectConfigurationHooks = addHooks<
  import('../../tasks/testing/types').ProjectConfigurationHooks
>(() => ({
  jestExtensions: new AsyncSeriesWaterfallHook(['extensions']),
  jestEnvironment: new AsyncSeriesWaterfallHook(['environment']),
  jestModuleMapper: new AsyncSeriesWaterfallHook(['moduleMapper']),
  jestSetupEnv: new AsyncSeriesWaterfallHook(['setupEnvFiles']),
  jestSetupTests: new AsyncSeriesWaterfallHook(['setupTestFiles']),
  jestTransforms: new AsyncSeriesWaterfallHook([
    'transform',
    'transformOptions',
  ]),
  jestConfig: new AsyncSeriesWaterfallHook(['jestConfig']),
}));

const addRootConfigurationHooks = addHooks<
  import('../../tasks/testing/types').RootConfigurationHooks
>(() => ({
  jestSetupEnv: new AsyncSeriesWaterfallHook(['setupEnvFiles']),
  jestSetupTests: new AsyncSeriesWaterfallHook(['setupTestFiles']),
  jestWatchIgnore: new AsyncSeriesWaterfallHook(['watchIgnore']),
  jestWatchPlugins: new AsyncSeriesWaterfallHook(['jestWatchPlugins']),
  jestConfig: new AsyncSeriesWaterfallHook(['jestConfig']),
  jestFlags: new AsyncSeriesWaterfallHook(['jestFlags']),
}));

interface JestFlags {
  config?: string;
  watch?: boolean;
  watchAll?: boolean;
  testNamePattern?: string;
  testPathPattern?: string;
  runInBand?: boolean;
  forceExit?: boolean;
  maxWorkers?: number;
  onlyChanged?: boolean;
  coverage?: boolean;
  updateSnapshot?: boolean;
}

export default function jest(tasks: RunnerTasks) {
  tasks.test.tap(PLUGIN, ({workspace, hooks}) => {
    const rootConfigPath = workspace.internal.configPath('jest/root.config.js');
    let rootConfigurationHooks!: import('../../tasks/testing/types').RootConfigurationHooks;
    const projectConfigurationHooks: import('../../tasks/testing/types').ProjectConfigurationHooks[] = [];

    hooks.configure.tap(
      PLUGIN,
      compose(
        addRootConfigurationHooks,
        (hooks) => {
          rootConfigurationHooks = hooks;

          hooks.jestWatchPlugins!.tap(PLUGIN, (watchPlugins) => [
            ...watchPlugins,
            'jest-watch-typeahead/filename',
            'jest-watch-typeahead/testname',
          ]);

          hooks.jestSetupEnv!.tapPromise(PLUGIN, async (setupEnvFiles) => {
            const packageSetupEnvFiles = ([] as string[]).concat(
              ...(await Promise.all([
                workspace.fs.glob('tests/setup/environment.*'),
                workspace.fs.glob('tests/setup/environment/index.*'),
              ])),
            );

            return [...setupEnvFiles, ...packageSetupEnvFiles];
          });

          hooks.jestSetupTests!.tapPromise(PLUGIN, async (setupTestsFiles) => {
            const packageSetupTestsFiles = ([] as string[]).concat(
              ...(await Promise.all([
                workspace.fs.glob('tests/setup/tests.*'),
                workspace.fs.glob('tests/setup/tests/index.*'),
              ])),
            );

            return [...setupTestsFiles, ...packageSetupTestsFiles];
          });
        },
      ),
    );

    hooks.preSteps.tap(PLUGIN, (steps) => [
      ...steps,
      createStep({label: 'Writing Jest configuration files'}, async () => {
        
      }),
    ]);

    hooks.project.tap(PLUGIN, ({project, hooks}) => {
      hooks.configure.tap(
        PLUGIN,
        compose(
          addProjectConfigurationHooks,
          (hooks) => {
            projectConfigurationHooks.push(hooks);

            hooks.jestSetupEnv!.tapPromise(PLUGIN, async (setupEnvFiles) => {
              const packageSetupEnvFiles = ([] as string[]).concat(
                ...(await Promise.all([
                  project.fs.glob('tests/setup/environment.*'),
                  project.fs.glob('tests/setup/environment/index.*'),
                ])),
              );

              return [...setupEnvFiles, ...packageSetupEnvFiles];
            });

            hooks.jestSetupTests!.tapPromise(
              PLUGIN,
              async (setupTestsFiles) => {
                const packageSetupTestsFiles = ([] as string[]).concat(
                  ...(await Promise.all([
                    project.fs.glob('tests/setup/tests.*'),
                    project.fs.glob('tests/setup/tests/index.*'),
                  ])),
                );

                return [...setupTestsFiles, ...packageSetupTestsFiles];
              },
            );
          },
        ),
      );
    });
  });
}
