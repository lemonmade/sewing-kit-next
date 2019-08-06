import exec from 'execa';
import {Workspace} from '../../workspace';
import {Runner, createStep, DiagnosticError} from '../../runner';
import {toArgs} from '../utilities';

export interface LintTaskOptions {
  fix?: boolean;
}

export interface LintTaskHooks {}

export interface LintTask {
  readonly hooks: LintTaskHooks;
  readonly options: LintTaskOptions;
  readonly workspace: Workspace;
}

export async function runLint(
  options: LintTaskOptions,
  workspace: Workspace,
  runner: Runner,
) {
  const {fix = false} = options;

  await runner.tasks.lint.promise({hooks: {}, options, workspace});

  const extensions = ['.js', '.mjs', '.ts', '.tsx'];
  const args = toArgs(
    {
      fix,
      maxWarnings: 0,
      format: 'codeframe',
      cache: true,
      cacheLocation: workspace.internal.cachePath('eslint/'),
      ext: extensions,
    },
    {dasherize: true},
  );

  const steps = [
    createStep(async (ui) => {
      try {
        const result = await exec('node_modules/.bin/eslint', ['.', ...args], {
          env: {FORCE_COLOR: '1'},
        });

        ui.log(result.all.trim() || 'Lint successfully completed.');
      } catch (error) {
        throw new DiagnosticError({
          message: error.all,
        });
      }
    }),
  ];

  await runner.run(steps);
}
