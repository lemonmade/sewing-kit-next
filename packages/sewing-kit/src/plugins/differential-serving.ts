import {produce} from 'immer';

import {Work} from '../work';
import {BrowserEntry, BrowserEntryVariants, BuildType} from '../concepts';

declare module '../concepts' {
  interface BrowserEntryVariants {
    browserTarget: 'baseline' | 'latest';
  }
}

const PLUGIN = 'SewingKit.differentialServing';

const BROWSER_TARGETS: {
  [K in BrowserEntryVariants['browserTarget']]: string[];
} = {
  baseline: [],
  latest: [],
};

export default function differentialServing(work: Work) {
  work.hooks.discovery.tap(PLUGIN, (discovery) => {
    discovery.hooks.browserApp.tap(PLUGIN, (appDiscovery) => {
      appDiscovery.hooks.entries.tap(PLUGIN, (entries) => {
        return entries.reduce<BrowserEntry[]>((allEntries, entry) => {
          return [
            ...allEntries,
            ...Object.keys(BROWSER_TARGETS).map((target) => ({
              ...entry,
              variants: [
                ...entry.variants,
                {
                  name: 'browserTarget' as const,
                  value: target as keyof typeof BROWSER_TARGETS,
                },
              ],
            })),
          ];
        }, []);
      });

      return true;
    });
  });

  work.hooks.build.tap(PLUGIN, (build) => {
    build.configuration.hooks.babel.tap(PLUGIN, (babelConfig, target) => {
      return produce(babelConfig, (babelConfig) => {
        if (target.type !== BuildType.Browser) {
          return;
        }

        const variant = target.variants.find(
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
}
