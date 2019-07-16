import {produce} from 'immer';
import {Work} from '../work';
import {BrowserBuildVariants, BrowserAppBuild} from '../build';

declare module '../build' {
  interface BrowserBuildVariants {
    browserTarget: 'baseline' | 'latest';
  }
}

const PLUGIN = 'SewingKit.differentialServing';

const BROWSER_TARGETS: {
  [K in BrowserBuildVariants['browserTarget']]: string[];
} = {
  baseline: [],
  latest: [],
};

export default function differentialServing(work: Work) {
  work.tasks.build.tap(PLUGIN, (build) => {
    build.hooks.browserApps.tap(PLUGIN, (browserBuilds) => {
      return browserBuilds.reduce<BrowserAppBuild[]>((allBuilds, build) => {
        return [
          ...allBuilds,
          ...Object.keys(BROWSER_TARGETS).map((target) =>
            produce(build, (build) => {
              build.variants.push({
                name: 'browserTarget',
                value: target as keyof typeof BROWSER_TARGETS,
              });
            }),
          ),
        ];
      }, []);
    });

    build.webpack.browser.tap(PLUGIN, (browserBuild) => {
      browserBuild.configuration.hooks.babel.tap(PLUGIN, (babelConfig) => {
        return produce(babelConfig, (babelConfig) => {
          const variant = browserBuild.variants.find(
            ({name}) => name === 'browserTarget',
          );

          if (variant == null) {
            return;
          }

          for (const preset of babelConfig.presets) {
            if (
              Array.isArray(preset) &&
              preset[0] === 'babel-preset-shopify/web'
            ) {
              preset[1] = preset[1] || {};
              preset[1].browsers = BROWSER_TARGETS[variant.value];
            }
          }
        });
      });
    });
  });
}
