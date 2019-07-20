import {join} from 'path';
import {produce} from 'immer';

import {Work} from '../../work';
import {
  changeBabelPreset,
  updateBabelPreset,
  CompileBabelStep,
  WriteEntriesStep,
} from '../utilities';

const PLUGIN = 'SewingKit.package-commonjs';
const VARIANT = 'node';
const EXTENSION = '.node';

declare module '../../tasks/build/types' {
  interface PackageBuildVariants {
    [VARIANT]: boolean;
  }
}

export default function packageNode(work: Work) {
  work.tasks.test.tap(PLUGIN, (test) => {
    test.configure.common.tap(PLUGIN, (configuration) => {
      configuration.extensions.tap(
        PLUGIN,
        produce((extensions: string[]) => {
          extensions.unshift(EXTENSION);
        }),
      );
    });
  });

  work.tasks.build.tap(PLUGIN, (build, workspace) => {
    build.variants.packages.tap(PLUGIN, (variants) => {
      variants.add(VARIANT);
    });

    build.configure.package.tap(PLUGIN, (configuration, _, variant) => {
      if (!variant.get(VARIANT)) {
        return;
      }

      configuration.babel.tap(PLUGIN, (babelConfig) => {
        return produce(babelConfig, (babelConfig) => {
          changeBabelPreset(
            ['babel-preset-shopify', 'babel-preset-shopify/web'],
            'babel-preset-shopify/node',
          )(babelConfig);

          updateBabelPreset('babel-preset-shopify/node', {
            modules: 'commonjs',
          })(babelConfig);
        });
      });

      configuration.output.tap(PLUGIN, (output) => join(output, 'node'));
    });

    build.steps.package.each.tapPromise(PLUGIN, async (steps, packageBuild) => {
      if (!packageBuild.variant.get(VARIANT)) {
        return steps;
      }

      const {pkg, config} = packageBuild;
      const outputPath = await config.output.promise(pkg.fs.buildPath());

      return produce(steps, (steps) => {
        steps.push(
          new CompileBabelStep(packageBuild, workspace, {
            outputPath,
            configFile: 'babel.node.js',
          }),
          new WriteEntriesStep(packageBuild, {
            outputPath,
            extension: EXTENSION,
            contents: (relative) =>
              `module.exports = require(${JSON.stringify(relative)})`,
          }),
        );
      });
    });
  });
}
