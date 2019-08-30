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

            compiler.hooks.done.tap(PLUGIN, () => {
              if (server) {
                server.kill();
                server = undefined;
              }

              server = step.exec('node', [file]);
            });

            compiler.watch({ignored: 'node_modules/**'}, (err, stats) => {
              if (err) {
                console.log(err);
              }

              if (stats.hasErrors()) {
                console.log(config.module.rules);
                console.log(stats.toString('errors-only'));
              }
            });

            // compiler.watch()
          },
        ),
      ];
    });
  });
}
