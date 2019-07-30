import {produce} from 'immer';
import {Work} from '../../work';

const PLUGIN = 'SewingKit.jest';

export default function json(work: Work) {
  work.tasks.test.tap(PLUGIN, (workspace, test) => {
    test.configureRoot.jestWatchPlugins.tap(
      PLUGIN,
      produce((watchPlugins: string[]) => {
        watchPlugins.push(
          'jest-watch-typeahead/filename',
          'jest-watch-typeahead/testname',
        );
      }),
    );

    test.configureRoot.setupEnv.tapPromise(PLUGIN, async (setupEnvFiles) => {
      const packageSetupEnvFiles = ([] as string[]).concat(
        ...(await Promise.all([
          workspace.fs.glob('tests/setup/environment.*'),
          workspace.fs.glob('tests/setup/environment/index.*'),
        ])),
      );

      return [...setupEnvFiles, ...packageSetupEnvFiles];
    });

    test.configureRoot.setupTests.tapPromise(
      PLUGIN,
      async (setupTestsFiles) => {
        const packageSetupTestsFiles = ([] as string[]).concat(
          ...(await Promise.all([
            workspace.fs.glob('tests/setup/tests.*'),
            workspace.fs.glob('tests/setup/tests/index.*'),
          ])),
        );

        return [...setupTestsFiles, ...packageSetupTestsFiles];
      },
    );

    test.configure.package.tap(PLUGIN, (configuration, pkg) => {
      configuration.setupEnv.tapPromise(PLUGIN, async (setupEnvFiles) => {
        const packageSetupEnvFiles = ([] as string[]).concat(
          ...(await Promise.all([
            pkg.fs.glob('tests/setup/environment.*'),
            pkg.fs.glob('tests/setup/environment/index.*'),
          ])),
        );

        return [...setupEnvFiles, ...packageSetupEnvFiles];
      });

      configuration.setupTests.tapPromise(PLUGIN, async (setupTestsFiles) => {
        const packageSetupTestsFiles = ([] as string[]).concat(
          ...(await Promise.all([
            pkg.fs.glob('tests/setup/tests.*'),
            pkg.fs.glob('tests/setup/tests/index.*'),
          ])),
        );

        return [...setupTestsFiles, ...packageSetupTestsFiles];
      });
    });
  });
}
