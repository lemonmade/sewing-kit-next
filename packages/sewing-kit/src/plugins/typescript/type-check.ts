import {AsyncSeriesWaterfallHook} from 'tapable';
import exec from 'execa';

import {createStep, DiagnosticError} from '../../runner';
import {TypeCheckTask} from '../../tasks/type-check';
import {addHooks, compose} from '../utilities';
import {PLUGIN} from './common';

declare module '../../tasks/type-check/types' {
  interface TypeCheckRootConfigurationCustomHooks {
    typescriptHeap: AsyncSeriesWaterfallHook<number>;
  }
}

export default function typeCheckTypeScript({hooks}: TypeCheckTask) {
  hooks.configure.tap(
    PLUGIN,
    compose(
      addHooks(() => ({
        typescriptHeap: new AsyncSeriesWaterfallHook(['heap']),
      })),
    ),
  );

  hooks.steps.tap(PLUGIN, (steps, {configuration}) => [
    ...steps,
    createStep({label: 'Type checking with TypeScript'}, async () => {
      const heap = await configuration.typescriptHeap!.promise(0);
      const heapArguments = heap ? [`--max-old-space-size=${heap}`] : [];

      try {
        await exec('node', [
          ...heapArguments,
          'node_modules/.bin/tsc',
          '--build',
          '--pretty',
        ]);
      } catch (error) {
        throw new DiagnosticError({
          message: error.all,
        });
      }
    }),
  ]);
}
