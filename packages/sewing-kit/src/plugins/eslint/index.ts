import {AsyncSeriesWaterfallHook} from 'tapable';
import exec from 'execa';

import {RunnerTasks, createStep, DiagnosticError} from '../../runner';
import {addHooks, toArgs} from '../utilities';

interface EslintFlags {
  fix?: boolean;
  maxWarnings?: number;
  format?: string;
  cache?: boolean;
  cacheLocation?: string;
  ext?: string[];
}

declare module '../../tasks/lint/types' {
  interface LintRootConfigurationCustomHooks {
    readonly eslintExtensions: AsyncSeriesWaterfallHook<string[]>;
    readonly eslintFlags: AsyncSeriesWaterfallHook<EslintFlags>;
  }
}

const PLUGIN = 'SewingKit.eslint';

const addRootConfigurationHooks = addHooks<
  import('../../tasks/lint/types').LintRootConfigurationHooks
>(() => ({
  eslintExtensions: new AsyncSeriesWaterfallHook(['extensions']),
  eslintFlags: new AsyncSeriesWaterfallHook(['flags']),
}));

export default function eslint(tasks: RunnerTasks) {
  tasks.lint.tap(PLUGIN, ({workspace, options, hooks}) => {
    hooks.configure.tap(PLUGIN, addRootConfigurationHooks);

    hooks.steps.tap(PLUGIN, (steps, {configuration}) => [
      ...steps,
      createStep({label: 'Linting scripts with ESLint'}, async () => {
        const {fix = false} = options;
        const extensions = await configuration.eslintExtensions!.promise([]);
        const args = toArgs(
          await configuration.eslintFlags!.promise({
            fix,
            maxWarnings: 0,
            format: 'codeframe',
            cache: true,
            cacheLocation: workspace.internal.cachePath('eslint/'),
            ext: extensions,
          }),
          {dasherize: true},
        );

        try {
          await exec('node_modules/.bin/eslint', ['.', ...args], {
            env: {FORCE_COLOR: '1'},
          });
        } catch (error) {
          throw new DiagnosticError({
            message: error.all,
          });
        }
      }),
    ]);
  });
}
