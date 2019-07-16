import {SyncHook} from 'tapable';

import {Build} from './build';
import {Workspace} from './concepts';
import {WorkspaceDiscovery} from './discovery';

export class Work {
  readonly hooks = {
    build: new SyncHook<Build, Workspace>(['build', 'workspace']),
    discovery: new SyncHook<WorkspaceDiscovery>(['workspace']),
  };
}
