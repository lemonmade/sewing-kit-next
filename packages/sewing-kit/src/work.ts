import {SyncHook} from 'tapable';

import {BuildTask, Environment} from './build';
import {Workspace, Project} from './concepts';
import {WorkspaceDiscovery} from './discovery';

export class Work {
  readonly tasks = {
    discovery: new SyncHook<WorkspaceDiscovery, Project>([
      'workspace',
      'project',
    ]),
    build: new SyncHook<BuildTask, Environment, Workspace>([
      'build',
      'env',
      'workspace',
    ]),
  };
}
