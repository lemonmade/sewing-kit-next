import jest from 'jest';
import {
  AsyncSeriesWaterfallHook,
  AsyncParallelHook,
  AsyncSeriesHook,
} from 'tapable';
import {Package, Workspace} from '../../workspace';
import {toArgs} from '../utilities';

interface BabelConfig {
  presets?: (string | [string, object?])[];
}

interface TransformOptions {
  babelTransform: string;
}

class Configuration {
  readonly babel = new AsyncSeriesWaterfallHook<BabelConfig>(['babelConfig']);
  readonly extensions = new AsyncSeriesWaterfallHook<string[]>(['extensions']);
  readonly environment = new AsyncSeriesWaterfallHook<string>(['environment']);
  readonly moduleMapper = new AsyncSeriesWaterfallHook<{[key: string]: string}>(
    ['moduleMapper'],
  );

  readonly setupEnv = new AsyncSeriesWaterfallHook<string[]>(['setupEnvFiles']);
  readonly setupTests = new AsyncSeriesWaterfallHook<string[]>([
    'setupTestFiles',
  ]);

  readonly jestTransforms = new AsyncSeriesWaterfallHook<
    {[key: string]: string},
    TransformOptions
  >(['transforms', 'options']);

  readonly jestFinalize = new AsyncSeriesWaterfallHook<jest.InitialOptions>([
    'jestConfig',
  ]);
}

interface TestTaskOptions {
  pre?: boolean;
  watch?: boolean;
  debug?: boolean;
  coverage?: boolean;
  testPattern?: string;
  testNamePattern?: string;
  maxWorkers?: number;
  updateSnapshot?: boolean;
}

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

interface ProjectConfigurationHooks {}

interface RootConfigurationHooks {}

export interface TestTaskHooks {
  readonly configureRoot: AsyncSeriesHook<RootConfigurationHooks>;
  readonly configureProject: AsyncSeriesHook<{
    project: Package;
    hooks: ProjectConfigurationHooks;
  }>;
  readonly configurePackage: AsyncSeriesHook<{
    pkg: Package;
    hooks: ProjectConfigurationHooks;
  }>;
}

export interface TestTask {
  readonly hooks: TestTaskHooks;
  readonly workspace: Workspace;
  readonly options: TestTaskOptions;
}

export async function runTests(options: TestTaskOptions, workspace: Workspace, work: Work) {
  process.env.BABEL_ENV = 'test';
  process.env.NODE_ENV = 'test';

  const rootSetupEnvFiles = await this.configureRoot.setupEnv.promise([]);
  const rootSetupTestsFiles = await this.configureRoot.setupTests.promise([]);

  const projects = await Promise.all(
    workspace.packages.map(async (pkg) => {
      const configuration = new Configuration();
      await this.configure.common.promise(configuration);
      await this.configure.package.promise(configuration, pkg);

      const babelTransform = workspace.internal.configPath(
        'jest/packages',
        pkg.name,
        'babel-transformer.js',
      );

      const babelConfig = await configuration.babel.promise({});
      const transform = await configuration.jestTransforms.promise(
        {},
        {babelTransform},
      );
      const environment = await configuration.environment.promise('node');
      const extensions = (await configuration.extensions.promise([])).map(
        (extension) => extension.replace('.', ''),
      );
      const moduleMapper = await configuration.moduleMapper.promise({});
      const setupEnvFiles = await configuration.setupEnv.promise(
        rootSetupEnvFiles,
      );
      const setupTestsFiles = await configuration.setupTests.promise(
        rootSetupTestsFiles,
      );

      await workspace.internal.write(
        babelTransform,
        `const {createTransformer} = require('babel-jest'); module.exports = createTransformer(${JSON.stringify(
          babelConfig,
        )})`,
      );

      const config = await configuration.jestFinalize.promise({
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

  const watchPlugins = await this.configureRoot.jestWatchPlugins.promise([]);
  const watchIgnorePatterns = await this.configureRoot.watchIgnore.promise([]);

  const rootConfigPath = workspace.internal.configPath('jest/root.config.js');

  const rootConfig = await this.configureRoot.jestFinalize.promise({
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
  } = this.options;

  const flags = await this.configureRoot.jestFlags.promise({
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

export class TestTask2 {
  readonly configure = {
    common: new AsyncParallelHook<Configuration>(['configuration']),
    package: new AsyncParallelHook<Configuration, Package>([
      'configuration',
      'pkg',
    ]),
  };

  readonly configureRoot = {
    watchIgnore: new AsyncSeriesWaterfallHook<string[]>(['watchIgnore']),
    setupEnv: new AsyncSeriesWaterfallHook<string[]>(['setupEnvFiles']),
    setupTests: new AsyncSeriesWaterfallHook<string[]>(['setupTestFiles']),
    cacheDirectory: new AsyncSeriesWaterfallHook<string>(['cacheDirectory']),

    jestWatchPlugins: new AsyncSeriesWaterfallHook<string[]>(['watchPlugins']),
    jestFinalize: new AsyncSeriesWaterfallHook<jest.InitialOptions>([
      'jestConfig',
    ]),
    jestFlags: new AsyncSeriesWaterfallHook<JestFlags>(['jestFlags']),
  };

  constructor(
    public readonly options: Options,
    private readonly workspace: Workspace,
  ) {}

  async run() {
    process.env.BABEL_ENV = 'test';
    process.env.NODE_ENV = 'test';

    const {workspace} = this;

    const rootSetupEnvFiles = await this.configureRoot.setupEnv.promise([]);
    const rootSetupTestsFiles = await this.configureRoot.setupTests.promise([]);

    const projects = await Promise.all(
      workspace.packages.map(async (pkg) => {
        const configuration = new Configuration();
        await this.configure.common.promise(configuration);
        await this.configure.package.promise(configuration, pkg);

        const babelTransform = workspace.internal.configPath(
          'jest/packages',
          pkg.name,
          'babel-transformer.js',
        );

        const babelConfig = await configuration.babel.promise({});
        const transform = await configuration.jestTransforms.promise(
          {},
          {babelTransform},
        );
        const environment = await configuration.environment.promise('node');
        const extensions = (await configuration.extensions.promise([])).map(
          (extension) => extension.replace('.', ''),
        );
        const moduleMapper = await configuration.moduleMapper.promise({});
        const setupEnvFiles = await configuration.setupEnv.promise(
          rootSetupEnvFiles,
        );
        const setupTestsFiles = await configuration.setupTests.promise(
          rootSetupTestsFiles,
        );

        await workspace.internal.write(
          babelTransform,
          `const {createTransformer} = require('babel-jest'); module.exports = createTransformer(${JSON.stringify(
            babelConfig,
          )})`,
        );

        const config = await configuration.jestFinalize.promise({
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

    const watchPlugins = await this.configureRoot.jestWatchPlugins.promise([]);
    const watchIgnorePatterns = await this.configureRoot.watchIgnore.promise(
      [],
    );

    const rootConfigPath = workspace.internal.configPath('jest/root.config.js');

    const rootConfig = await this.configureRoot.jestFinalize.promise({
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
    } = this.options;

    const flags = await this.configureRoot.jestFlags.promise({
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
}
