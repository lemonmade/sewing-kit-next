import jest from 'jest';
import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';

import {Work} from '../../work';
import {Workspace} from '../../workspace';
import {toArgs} from '../utilities';

import {
  TestTaskHooks,
  TestTaskOptions,
  RootConfigurationHooks,
  ProjectConfigurationHooks,
} from './types';

export async function runTests(
  options: TestTaskOptions,
  workspace: Workspace,
  work: Work,
) {
  process.env.BABEL_ENV = 'test';
  process.env.NODE_ENV = 'test';

  const hooks: TestTaskHooks = {
    configureRoot: new AsyncSeriesHook(['rootConfigurationHooks']),
    configureProject: new AsyncSeriesHook(['projectConfiguration']),
    configurePackage: new AsyncSeriesHook(['packageConfiguration']),
  };

  await work.tasks.test.promise({hooks, workspace, options});

  const rootConfigHooks: RootConfigurationHooks = {
    setupEnv: new AsyncSeriesWaterfallHook(['setupEnvFiles']),
    setupTests: new AsyncSeriesWaterfallHook(['setupTestFiles']),
    watchIgnore: new AsyncSeriesWaterfallHook(['watchIgnore']),
    jestWatchPlugins: new AsyncSeriesWaterfallHook(['jestWatchPlugins']),
    jestConfig: new AsyncSeriesWaterfallHook(['jestConfig']),
    jestFlags: new AsyncSeriesWaterfallHook(['jestFlags']),
  };

  await hooks.configureRoot.promise(rootConfigHooks);

  const [rootSetupEnvFiles, rootSetupTestsFiles] = await Promise.all([
    rootConfigHooks.setupEnv.promise([]),
    rootConfigHooks.setupTests.promise([]),
  ]);

  const projects = await Promise.all(
    workspace.packages.map(async (pkg) => {
      const projectConfigHooks: ProjectConfigurationHooks = {
        babel: new AsyncSeriesWaterfallHook(['babelConfig']),
        extensions: new AsyncSeriesWaterfallHook(['extensions']),
        environment: new AsyncSeriesWaterfallHook(['environment']),
        moduleMapper: new AsyncSeriesWaterfallHook(['moduleMapper']),

        setupEnv: new AsyncSeriesWaterfallHook(['setupEnvFiles']),
        setupTests: new AsyncSeriesWaterfallHook(['setupTestFiles']),

        jestTransforms: new AsyncSeriesWaterfallHook([
          'transform',
          'transformOptions',
        ]),
        jestConfig: new AsyncSeriesWaterfallHook(['jestConfig']),
      };

      await hooks.configureProject.promise({
        project: pkg,
        hooks: projectConfigHooks,
      });

      await hooks.configurePackage.promise({
        pkg,
        hooks: projectConfigHooks,
      });

      const babelTransform = workspace.internal.configPath(
        'jest/packages',
        pkg.name,
        'babel-transformer.js',
      );

      const babelConfig = await projectConfigHooks.babel.promise({});
      const transform = await projectConfigHooks.jestTransforms.promise(
        {},
        {babelTransform},
      );
      const environment = await projectConfigHooks.environment.promise('node');
      const extensions = (await projectConfigHooks.extensions.promise([])).map(
        (extension) => extension.replace('.', ''),
      );
      const moduleMapper = await projectConfigHooks.moduleMapper.promise({});
      const setupEnvFiles = await projectConfigHooks.setupEnv.promise(
        rootSetupEnvFiles,
      );
      const setupTestsFiles = await projectConfigHooks.setupTests.promise(
        rootSetupTestsFiles,
      );

      await workspace.internal.write(
        babelTransform,
        `const {createTransformer} = require('babel-jest'); module.exports = createTransformer(${JSON.stringify(
          babelConfig,
        )})`,
      );

      const config = await projectConfigHooks.jestConfig.promise({
        displayName: pkg.name,
        rootDir: pkg.root,
        testRegex: `.*\\.test\\.(${extensions.join('|')})$`,
        moduleFileExtensions: extensions,
        testEnvironment: environment,
        moduleNameMapper: moduleMapper,
        setupFiles: setupEnvFiles,
        setupFilesAfterEnv: setupTestsFiles,
        transform,
      });

      return config;
    }),
  );

  const watchPlugins = await rootConfigHooks.jestWatchPlugins.promise([]);
  const watchIgnorePatterns = await rootConfigHooks.watchIgnore.promise([]);

  const rootConfigPath = workspace.internal.configPath('jest/root.config.js');

  const rootConfig = await rootConfigHooks.jestConfig.promise({
    rootDir: workspace.root,
    projects,
    watchPlugins,
    watchPathIgnorePatterns: watchIgnorePatterns,
  } as any);

  await workspace.internal.write(
    rootConfigPath,
    `module.exports = ${JSON.stringify(rootConfig)};`,
  );

  const {
    coverage = false,
    debug = false,
    watch = true,
    testPattern,
    testNamePattern,
    maxWorkers,
    updateSnapshot,
  } = options;

  const flags = await rootConfigHooks.jestFlags.promise({
    config: rootConfigPath,
    coverage,
    watch: watch && testPattern == null,
    watchAll: watch && testPattern != null,
    onlyChanged: testPattern == null,
    testNamePattern,
    testPathPattern: testPattern,
    maxWorkers,
    updateSnapshot,
    runInBand: debug,
    forceExit: debug,
  });

  jest.run(toArgs(flags));
}
