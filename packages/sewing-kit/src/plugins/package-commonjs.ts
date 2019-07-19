import {join} from 'path';
import {produce} from 'immer';

import {Work} from '../work';
import {
  updateBabelPreset,
  CompileBabelStep,
  WriteEntriesStep,
} from './utilities';

const PLUGIN = 'SewingKit.package-commonjs';
const VARIANT = 'commonjs';

declare module '../tasks/build/types' {
  interface PackageBuildVariants {
    [VARIANT]: boolean;
  }
}

export default function packageCommonJs(work: Work) {
  work.tasks.build.tap(PLUGIN, (build, workspace) => {
    build.variants.packages.tap(PLUGIN, (variants) => {
      variants.add(VARIANT);
    });

    build.configure.package.tap(PLUGIN, (configuration, _, variant) => {
      if (!variant.get(VARIANT)) {
        return;
      }

      configuration.babel.tap(PLUGIN, (babelConfig) => {
        return produce(
          babelConfig,
          updateBabelPreset(
            [
              'babel-preset-shopify',
              'babel-preset-shopify/web',
              'babel-preset-shopify/node',
            ],
            {modules: 'commonjs'},
          ),
        );
      });

      configuration.output.tap(PLUGIN, (output) => join(output, 'cjs'));
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
            configFile: 'babel.cjs.js',
          }),
          new WriteEntriesStep(packageBuild, {
            outputPath,
            extension: '.js',
            contents: (relative) =>
              `module.exports = require(${JSON.stringify(relative)})`,
          }),
        );
      });
    });
  });
}
