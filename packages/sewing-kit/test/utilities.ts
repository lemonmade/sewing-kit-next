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
import {run, Options} from '../src';

export class Workspace {
  constructor(public readonly directory: string) {}

  async run(options: Options) {
    await run(options);
  }

  async writeConfig(contents: string) {
    await writeFile(resolve(this.directory, 'sewing-kit.config.ts'), contents);
  }

  async writeFile(file: string, contents: string) {
    const path = this.resolve(file);
    await mkdirp(dirname(path));
    await writeFile(path, contents);
  }

  contents(file: string) {
    return readFile(this.resolve(file), 'utf8');
  }

  contains(file: string) {
    return pathExists(this.resolve(file));
  }

  resolve(file: string) {
    return resolve(this.directory, file);
  }

  debug() {
    console.log(toTree(this.directory, {allFiles: true}));
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
