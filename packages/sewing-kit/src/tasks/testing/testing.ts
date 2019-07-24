import {execSync} from 'child_process';
import {AsyncSeriesWaterfallHook, AsyncParallelHook} from 'tapable';
import {Package, Workspace} from '../../workspace';

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
  readonly setupTests = new AsyncSeriesWaterfallHook<string[]>(['setupTestFiles']);

  readonly jestTransforms = new AsyncSeriesWaterfallHook<
    {[key: string]: string},
    TransformOptions
  >(['transforms', 'options']);
  readonly jestFinalize = new AsyncSeriesWaterfallHook<jest.InitialOptions>([
    'jestConfig',
  ]);
}

export class TestTask {
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
    jestWatchPlugins: new AsyncSeriesWaterfallHook<string[]>(['watchPlugins']),
    jestFinalize: new AsyncSeriesWaterfallHook<jest.InitialOptions>([
      'jestConfig',
    ]),
  };

  constructor(private readonly workspace: Workspace) {}

  async run() {
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
        const setupEnvFiles = await configuration.setupEnv.promise(rootSetupEnvFiles);
        const setupTestsFiles = await configuration.setupTests.promise(rootSetupTestsFiles);

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

    execSync(
      `node_modules/.bin/jest --config ${JSON.stringify(rootConfigPath)}`,
      {
        stdio: 'inherit',
      },
    );
  }
}
