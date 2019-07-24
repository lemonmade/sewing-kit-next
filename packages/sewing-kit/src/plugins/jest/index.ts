import {produce} from 'immer';
import {Work} from '../../work';

const PLUGIN = 'SewingKit.jest';

export default function json(work: Work) {
  work.tasks.test.tap(PLUGIN, (test, workspace) => {
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
          workspace.fs.glob('tests/setup/env.*'),
          workspace.fs.glob('tests/setup/env/index.*'),
        ])),
      );

      return [...setupEnvFiles, ...packageSetupEnvFiles];
    });

    test.configureRoot.setupTests.tapPromise(
      PLUGIN,
      async (setupTestsFiles) => {
        const packageSetupTestsFiles = ([] as string[]).concat(
          ...(await Promise.all([
            workspace.fs.glob('tests/setup/env.*'),
            workspace.fs.glob('tests/setup/env/index.*'),
          ])),
        );

        return [...setupTestsFiles, ...packageSetupTestsFiles];
      },
    );

    test.configure.package.tap(PLUGIN, (configuration, pkg) => {
      configuration.setupEnv.tapPromise(PLUGIN, async (setupEnvFiles) => {
        const packageSetupEnvFiles = ([] as string[]).concat(
          ...(await Promise.all([
            pkg.fs.glob('tests/setup/env.*'),
            pkg.fs.glob('tests/setup/env/index.*'),
          ])),
        );

        return [...setupEnvFiles, ...packageSetupEnvFiles];
      });

      configuration.setupTests.tapPromise(PLUGIN, async (setupTestsFiles) => {
        const packageSetupTestsFiles = ([] as string[]).concat(
          ...(await Promise.all([
            pkg.fs.glob('tests/setup/env.*'),
            pkg.fs.glob('tests/setup/env/index.*'),
          ])),
        );

        return [...setupTestsFiles, ...packageSetupTestsFiles];
      });
    });
  });
}
