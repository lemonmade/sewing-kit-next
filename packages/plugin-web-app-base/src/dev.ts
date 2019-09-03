import {createStep} from '@sewing-kit/ui';
import {DevTask} from '@sewing-kit/core';
import {} from '@sewing-kit/plugin-webpack';

import {PLUGIN, createWebpackConfig} from './common';

export default function devWebApp({hooks, workspace}: DevTask) {
  hooks.webApp.tap(PLUGIN, ({webApp, hooks}) => {
    hooks.steps.tap(PLUGIN, (steps, {buildBrowserConfig}) => {
      return [
        ...steps,
        createStep({indefinite: true}, async () => {
          const {default: webpack} = await import('webpack');
          const {default: koaWebpack} = await import('koa-webpack');
          const {default: Koa} = await import('koa');

          const devServerHost = 'localhost';
          const devServerScheme = 'http://';
          const devServerPort = 8081;

          buildBrowserConfig.webpackPublicPath!.tap(
            PLUGIN,
            () => `${devServerScheme}${devServerHost}:${devServerPort}/assets`,
          );

          const config = await createWebpackConfig(
            buildBrowserConfig,
            webApp,
            workspace,
            {
              mode: 'development',
            },
          );

          const compiler = webpack(config);
          const middleware = await koaWebpack({
            compiler,
            hotClient: false,
            devMiddleware: {logLevel: 'silent'} as any,
          });
          const app = new Koa();

          app.use(middleware);
          app.listen(devServerPort, () => {
            // eslint-disable-next-line no-console
            console.log(
              `Listening on ${devServerScheme}${devServerHost}:${devServerPort}`,
            );
          });
        }),
      ];
    });
  });
}
