import {AsyncSeriesWaterfallHook} from 'tapable';
import exec from 'execa';

import {LintRootConfigurationHooks} from '../../tasks/lint/types';
import {RunnerTasks, createStep, DiagnosticError} from '../../runner';
import {addHooks, compose, toArgs} from '../utilities';

interface EslintFlags {
  fix?: boolean;
  maxWarnings?: number;
  format?: 'codeframe';
  cache?: boolean;
  cacheLocation?: string;
  ext?: string[];
}

declare module '../../tasks/lint/types' {
  interface LintRootConfigurationCustomHooks {
    eslintExtensions: AsyncSeriesWaterfallHook<string[]>;
    eslintFlags: AsyncSeriesWaterfallHook<EslintFlags>;
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
  let rootConfigurationHooks!: LintRootConfigurationHooks;

  tasks.lint.tap(PLUGIN, ({workspace, options, hooks}) => {
    hooks.configure.tap(
      PLUGIN,
      compose(
        addRootConfigurationHooks,
        (hooks) => {
          rootConfigurationHooks = hooks;
        },
      ),
    );

    hooks.steps.tap(PLUGIN, (steps) => [
      ...steps,
      createStep({label: 'Linting scripts with ESLint'}, async () => {
        const {fix = false} = options;
        const extensions = await rootConfigurationHooks.eslintExtensions!.promise(
          [],
        );
        const args = toArgs(
          await rootConfigurationHooks.eslintFlags!.promise({
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
