import arg, {Result} from 'arg';
import * as plugins from '../plugins';

const DEFAULT_PLUGINS = Object.values(plugins);

export function createCommand<Flags extends {[key: string]: any}>(
  flagSpec: Flags,
  run: (
    flags: Result<Flags>,
    workspace: import('../workspace').Workspace,
    work: import('../work').Work,
  ) => Promise<void>,
) {
  return async (argv: string[]) => {
    const {Work} = await import('../work');

    const work = new Work();

    for (const plugin of DEFAULT_PLUGINS) {
      plugin.call(work, work);
    }

    const {runDiscovery} = await import('../tasks/discovery');

    const {'--root': root, ...flags} = arg(
      {...flagSpec, '--root': String},
      {argv},
    );

    const workspace = await runDiscovery({root: root as any}, work);
    await run(flags as any, workspace, work);
  };
}
