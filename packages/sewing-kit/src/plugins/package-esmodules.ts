import {join} from 'path';
import {produce} from 'immer';

import {Work} from '../work';
import {updateBabelPreset, CompileBabelStep} from './utilities';

const PLUGIN = 'SewingKit.package-esmodules';
const VARIANT = 'esmodules';

declare module '../tasks/build/types' {
  interface PackageBuildVariants {
    [VARIANT]: boolean;
  }
}

export default function packageEsmodules(work: Work) {
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
            {modules: false},
          ),
        );
      });

      configuration.output.tap(PLUGIN, (output) => join(output, 'esm'));
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
            configFile: 'babel.esm.js',
          }),
        );
      });
    });
  });
}
