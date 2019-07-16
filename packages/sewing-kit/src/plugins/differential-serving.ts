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
    build.discovery.browserApps.tap(PLUGIN, (browserBuilds) => {
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

    build.configure.browser.tap(PLUGIN, (configuration, browserBuild) => {
      const variant = browserBuild.variants.find(
        ({name}) => name === 'browserTarget',
      );

      if (variant == null) {
        return;
      }

      configuration.babel.tap(PLUGIN, (babelConfig) => {
        return produce(babelConfig, (babelConfig) => {
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
