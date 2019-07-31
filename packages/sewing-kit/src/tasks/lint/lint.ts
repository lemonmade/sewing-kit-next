import exec, {ExecaError} from 'execa';
import {Work} from '../../work';
import {Workspace} from '../../workspace';
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
  work: Work,
) {
  const {fix = false} = options;

  await work.tasks.lint.promise({hooks: {}, options, workspace});

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

  try {
    const result = await exec('node_modules/.bin/eslint', ['.', ...args], {
      env: {FORCE_COLOR: '1'},
    });

    // eslint-disable-next-line no-console
    console.log(result.all);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log((error as ExecaError).all);
    process.exitCode = 1;
  }
}
