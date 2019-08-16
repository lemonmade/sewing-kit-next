import {AsyncSeriesWaterfallHook} from 'tapable';
import {createStep, DiagnosticError} from '@sewing-kit/ui';
import {createRootPlugin, addHooks, toArgs} from '@sewing-kit/plugin-utilities';

interface EslintFlags {
  fix?: boolean;
  maxWarnings?: number;
  format?: string;
  cache?: boolean;
  cacheLocation?: string;
  ext?: string[];
}

declare module '@sewing-kit/core/build/ts/tasks/lint/types' {
  interface LintRootConfigurationCustomHooks {
    readonly eslintExtensions: AsyncSeriesWaterfallHook<string[]>;
    readonly eslintFlags: AsyncSeriesWaterfallHook<EslintFlags>;
  }
}

const PLUGIN = 'SewingKit.eslint';

const addRootConfigurationHooks = addHooks<
  import('@sewing-kit/core').LintRootConfigurationHooks
>(() => ({
  eslintExtensions: new AsyncSeriesWaterfallHook(['extensions']),
  eslintFlags: new AsyncSeriesWaterfallHook(['flags']),
}));

export default createRootPlugin(PLUGIN, (tasks) => {
  tasks.lint.tap(PLUGIN, ({workspace, options, hooks}) => {
    hooks.configure.tap(PLUGIN, addRootConfigurationHooks);

    hooks.steps.tap(PLUGIN, (steps, {configuration}) => [
      ...steps,
      createStep({label: 'Linting scripts with ESLint'}, async (step) => {
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
          await step.exec('node_modules/.bin/eslint', ['.', ...args], {
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
});