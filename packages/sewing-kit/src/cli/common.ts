import {Readable, Writable} from 'stream';
import arg, {Result} from 'arg';
import * as plugins from '../plugins';

const DEFAULT_PLUGINS = Object.values(plugins);

interface InternalOptions {
  __internal?: {stdin?: Readable; stdout?: Writable; stderr?: Writable};
}

export function createCommand<Flags extends {[key: string]: any}>(
  flagSpec: Flags,
  run: (
    flags: Result<Flags>,
    workspace: import('../workspace').Workspace,
    runner: import('../runner').Runner,
  ) => Promise<void>,
) {
  return async (
    argv: string[],
    {__internal: internalOptions = {}}: InternalOptions = {},
  ) => {
    const {Runner, Ui, DiagnosticError} = await import('../runner');
    const ui = new Ui(internalOptions as any);
    const runner = new Runner(ui);

    for (const plugin of DEFAULT_PLUGINS) {
      plugin.call(runner.tasks, runner.tasks);
    }

    const {runDiscovery} = await import('../tasks/discovery');

    const {'--root': root, ...flags} = arg(
      {...flagSpec, '--root': String},
      {argv},
    );

    try {
      const workspace = await runDiscovery({root: root as any}, runner);
      await run(flags as any, workspace, runner);
    } catch (error) {
      if (error instanceof DiagnosticError) {
        ui.log(error.message);
      } else {
        ui.log(
          'The following unexpected error occurred. Please raise an issue on [the sewing-kit repo](https://github.com/Shopify/sewing-kit).',
        );
        ui.log(error.message);
        ui.log(error.stack);
      }

      process.exitCode = 1;
    }
  };
}
