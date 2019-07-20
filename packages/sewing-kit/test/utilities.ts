import 'core-js/features/array/flat';
import 'core-js/features/array/flat-map';

import {resolve, dirname} from 'path';
import {
  mkdirp,
  rmdir,
  writeFile,
  readFile,
  pathExists,
  emptyDir,
} from 'fs-extra';
import toTree from 'tree-node-cli';
import {
  IfAllOptionalKeys,
  FirstArgument,
  ThenType,
} from '@shopify/useful-types';

const commandMap = {
  build: () => import('../src/cli/build').then(({build}) => build),
};

type CommandMap = typeof commandMap;
type CommandType<T extends keyof CommandMap> = ThenType<
  ReturnType<CommandMap[T]>
>;

export class Workspace {
  constructor(public readonly root: string) {}

  async run<K extends keyof CommandMap>(
    ...args: IfAllOptionalKeys<
      FirstArgument<CommandType<K>>,
      [K, FirstArgument<CommandType<K>>?],
      [K, FirstArgument<CommandType<K>>]
    >
  ) {
    const [command, options = {}] = args;
    await (await commandMap[command]())({...options, root: this.root});
  }

  async writeConfig(contents: string) {
    await writeFile(resolve(this.root, 'sewing-kit.config.ts'), contents);
  }

  async writeFile(file: string, contents: string) {
    const path = this.resolvePath(file);
    await mkdirp(dirname(path));
    await writeFile(path, contents);
  }

  contents(file: string) {
    return readFile(this.resolvePath(file), 'utf8');
  }

  contains(file: string) {
    return pathExists(this.resolvePath(file));
  }

  resolvePath(file: string) {
    return resolve(this.root, file);
  }

  debug() {
    console.log(toTree(this.root, {allFiles: true}));
  }
}

export async function withWorkspace(
  name: string,
  useWorkspace: (workspace: Workspace) => void,
) {
  const root = resolve(__dirname, '../../../tmp');
  const directory = resolve(root, name);
  const workspace = new Workspace(directory);

  try {
    await mkdirp(directory);
    await useWorkspace(workspace);
  } finally {
    await emptyDir(directory);
    await rmdir(directory);
  }
}
