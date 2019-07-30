import exec, {ExecaError} from 'execa';
import {Workspace} from '../../workspace';
import {toArgs} from '../utilities';

interface Options {
  fix?: boolean;
}

export class LintTask {
  readonly configure = {};

  constructor(
    public readonly options: Options,
    public readonly workspace: Workspace,
  ) {}

  async run() {
    const {fix = false} = this.options;
    const extensions = ['.js', '.mjs', '.ts', '.tsx'];
    const args = toArgs(
      {
        fix,
        maxWarnings: 0,
        format: 'codeframe',
        cache: true,
        cacheLocation: this.workspace.internal.cachePath('eslint/'),
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
}
