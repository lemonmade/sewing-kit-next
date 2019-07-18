import {SyncHook} from 'tapable';

import {BuildTask, Environment} from './build';
import {Workspace} from './concepts';
import {WorkspaceDiscovery} from './discovery';

export class Work {
  readonly tasks = {
    discovery: new SyncHook<WorkspaceDiscovery>(['workspace']),
    build: new SyncHook<BuildTask, Environment, Workspace>([
      'build',
      'env',
      'workspace',
    ]),
  };
}
