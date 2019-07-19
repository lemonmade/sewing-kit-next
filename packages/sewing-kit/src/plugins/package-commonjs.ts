import {join} from 'path';
import {Work} from '../work';

const PLUGIN = 'SewingKit.package-commonjs';
const VARIANT = 'commonjs';

declare module '../tasks/build/types' {
  interface PackageBuildVariants {
    [VARIANT]: boolean;
  }
}

export default function packageCommonJs(work: Work) {
  work.tasks.build.tap(PLUGIN, (build) => {
    build.variants.packages.tap(PLUGIN, (variants) => {
      variants.add(VARIANT);
    });

    build.configure.package.tap(PLUGIN, (configuration, {variant}) => {
      if (!variant.get(VARIANT)) {
        return;
      }

      configuration.output.tap(PLUGIN, (output) => join(output, 'cjs'));
    });
  });
}
