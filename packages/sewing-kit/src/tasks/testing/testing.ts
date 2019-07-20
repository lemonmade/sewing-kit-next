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
  readonly transforms = new AsyncSeriesWaterfallHook<
    {[key: string]: string},
    TransformOptions
  >(['transforms', 'options']);
}

export class TestTask {
  readonly configure = {
    common: new AsyncParallelHook<Configuration>(['configuration']),
    package: new AsyncParallelHook<Configuration, Package>([
      'configuration',
      'pkg',
    ]),
  };

  constructor(private readonly workspace: Workspace) {}

  async run() {
    const {workspace} = this;

    await Promise.all(
      workspace.packages.map(async (pkg) => {
        const configuration = new Configuration();
        await this.configure.common.promise(configuration);
        await this.configure.package.promise(configuration, pkg);

        const babelTransform = workspace.sewingKit.configPath(
          'jest/packages',
          pkg.name,
          'babel-transformer.js',
        );

        const babelConfig = await configuration.babel.promise({});
        const transform = await configuration.transforms.promise(
          {},
          {babelTransform},
        );
        const environment = await configuration.environment.promise('node');
        const extensions = (await configuration.extensions.promise([])).map(
          (extension) => extension.replace('.', ''),
        );

        const config = {
          displayName: pkg.name,
          rootDir: pkg.root,
          testRegex: `.*\\.test\\.(${extensions.join('|')})$`,
          moduleFileExtensions: extensions,
          testEnvironment: environment,
          transform,
        };

        await workspace.sewingKit.write(
          babelTransform,
          `const {createTransformer} = require('babel-jest'); module.exports = createTransformer(${JSON.stringify(
            babelConfig,
          )})`,
        );

        await workspace.sewingKit.write(
          workspace.sewingKit.configPath(
            'jest/packages',
            pkg.name,
            'jest.config.js',
          ),
          `module.exports = ${JSON.stringify(config)};`,
        );
      }),
    );

    const rootConfigPath = workspace.sewingKit.configPath(
      'jest/root.config.js',
    );

    await workspace.sewingKit.write(
      rootConfigPath,
      `module.exports = ${JSON.stringify({
        rootDir: workspace.root,
        testRegex: '.+\\.test\\.\\w+$',
        projects: [
          workspace.sewingKit.configPath('jest/packages/*/jest.config.js'),
        ],
        watchPlugins: ['jest-watch-yarn-workspaces'],
        watchPathIgnorePatterns: ['/tmp/', '/dist/'],
      })};`,
    );

    execSync(
      `node_modules/.bin/jest --watch --config ${JSON.stringify(
        rootConfigPath,
      )}`,
      {
        stdio: 'inherit',
      },
    );
  }
}
