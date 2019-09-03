import {join} from 'path';
import {createStep} from '@sewing-kit/ui';
import {DevTask} from '@sewing-kit/core';
import {} from '@sewing-kit/plugin-webpack';

import {PLUGIN, createWebpackConfig} from './common';

export default function devService({hooks, workspace}: DevTask) {
  hooks.service.tap(PLUGIN, ({service, hooks}) => {
    hooks.steps.tap(PLUGIN, (steps, {buildConfig}) => {
      return [
        ...steps,
        createStep(
          {indefinite: true, label: 'Compiling for development mode'},
          async (step) => {
            const {default: webpack} = await import('webpack');

            const config = await createWebpackConfig(
              buildConfig,
              service,
              workspace,
              {
                mode: 'development',
              },
            );

            const compiler = webpack(config);
            const file = join(config.output!.path!, config.output!.filename!);

            let server: import('execa').ExecaChildProcess<string> | undefined;

            const start = () => {
              if (server) {
                server.kill();
                server = undefined;
              }

              server = step.exec('node', [file]);
              server!.stdout!.on('data', (chunk) => {
                // eslint-disable-next-line no-console
                console.log(chunk.toString().trim());
              });
            };

            compiler.hooks.done.tap(PLUGIN, start);

            compiler.watch({ignored: 'node_modules/**'}, (err, stats) => {
              if (err) {
                // eslint-disable-next-line no-console
                console.log(err);
              }

              if (stats.hasErrors()) {
                // eslint-disable-next-line no-console
                console.log(stats.toString('errors-only'));
              }
            });
          },
        ),
      ];
    });
  });
}
