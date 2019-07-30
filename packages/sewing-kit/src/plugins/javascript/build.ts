import {produce} from 'immer';
import {Workspace} from '../../workspace';
import {BuildTaskHooks, BabelConfig} from '../../tasks/build';
import {PLUGIN} from './common';

function addBaseBabelPreset(babelConfig: BabelConfig) {
  return produce(babelConfig, (babelConfig) => {
    babelConfig.presets = babelConfig.presets || [];
    babelConfig.presets.push('babel-preset-shopify');
  });
}

function addJsExtensions(extensions: string[]) {
  return ['.js', '.mjs', ...extensions];
}

export default function buildJavaScript(_: Workspace, build: BuildTaskHooks) {
  build.package.tap(PLUGIN, (_, packageBuildHooks) => {
    packageBuildHooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.babel.tap(PLUGIN, addBaseBabelPreset);
      configurationHooks.extensions.tap(PLUGIN, addJsExtensions);
    });
  });

  build.webApp.tap(PLUGIN, (_, webAppBuildHooks) => {
    webAppBuildHooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.babel.tap(PLUGIN, addBaseBabelPreset);
      configurationHooks.extensions.tap(PLUGIN, addJsExtensions);

      configurationHooks.webpackRules.tapPromise(
        PLUGIN,
        async (rules, target) => {
          const options = await configurationHooks.babel.promise({}, target);

          return produce(rules, (rules) => {
            rules.push({
              test: /\.m?js/,
              exclude: /node_modules/,
              loader: 'babel-loader',
              options,
            });
          });
        },
      );
    });
  });
}
