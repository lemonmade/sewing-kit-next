import {produce} from 'immer';
import {RunnerTasks} from '../../runner';

const PLUGIN = 'SewingKit.jest';

export default function json(tasks: RunnerTasks) {
  tasks.test.tap(PLUGIN, ({workspace, hooks}) => {
    hooks.configureRoot.tap(PLUGIN, (hooks) => {
      hooks.jestWatchPlugins.tap(
        PLUGIN,
        produce((watchPlugins: string[]) => {
          watchPlugins.push(
            'jest-watch-typeahead/filename',
            'jest-watch-typeahead/testname',
          );
        }),
      );

      hooks.setupEnv.tapPromise(PLUGIN, async (setupEnvFiles) => {
        const packageSetupEnvFiles = ([] as string[]).concat(
          ...(await Promise.all([
            workspace.fs.glob('tests/setup/environment.*'),
            workspace.fs.glob('tests/setup/environment/index.*'),
          ])),
        );

        return [...setupEnvFiles, ...packageSetupEnvFiles];
      });

      hooks.setupTests.tapPromise(PLUGIN, async (setupTestsFiles) => {
        const packageSetupTestsFiles = ([] as string[]).concat(
          ...(await Promise.all([
            workspace.fs.glob('tests/setup/tests.*'),
            workspace.fs.glob('tests/setup/tests/index.*'),
          ])),
        );

        return [...setupTestsFiles, ...packageSetupTestsFiles];
      });
    });

    hooks.configureProject.tap(PLUGIN, ({project, hooks}) => {
      hooks.setupEnv.tapPromise(PLUGIN, async (setupEnvFiles) => {
        const packageSetupEnvFiles = ([] as string[]).concat(
          ...(await Promise.all([
            project.fs.glob('tests/setup/environment.*'),
            project.fs.glob('tests/setup/environment/index.*'),
          ])),
        );

        return [...setupEnvFiles, ...packageSetupEnvFiles];
      });

      hooks.setupTests.tapPromise(PLUGIN, async (setupTestsFiles) => {
        const packageSetupTestsFiles = ([] as string[]).concat(
          ...(await Promise.all([
            project.fs.glob('tests/setup/tests.*'),
            project.fs.glob('tests/setup/tests/index.*'),
          ])),
        );

        return [...setupTestsFiles, ...packageSetupTestsFiles];
      });
    });
  });
}
