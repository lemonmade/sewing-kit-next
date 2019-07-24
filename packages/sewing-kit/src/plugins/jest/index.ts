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
      if (!(await workspace.fs.hasFile('tests/setup/env.*'))) {
        return setupEnvFiles;
      }

      return [...setupEnvFiles, workspace.fs.resolvePath('tests/setup/env')];
    });

    test.configureRoot.setupTests.tapPromise(PLUGIN, async (setupTestsFiles) => {
      if (!(await workspace.fs.hasFile('tests/setup/tests.*'))) {
        return setupTestsFiles;
      }

      return [...setupTestsFiles, workspace.fs.resolvePath('tests/setup/tests')];
    });

    test.configure.package.tap(PLUGIN, (configuration, pkg) => {
      configuration.setupEnv.tapPromise(PLUGIN, async (setupEnvFiles) => {
        if (!(await pkg.fs.hasFile('tests/setup/env.*'))) {
          return setupEnvFiles;
        }
  
        return [...setupEnvFiles, pkg.fs.resolvePath('tests/setup/env')];
      });
  
      configuration.setupTests.tapPromise(PLUGIN, async (setupTestsFiles) => {
        if (!(await pkg.fs.hasFile('tests/setup/tests.*'))) {
          return setupTestsFiles;
        }
  
        return [...setupTestsFiles, pkg.fs.resolvePath('tests/setup/tests')];
      });
    });
  });
}
