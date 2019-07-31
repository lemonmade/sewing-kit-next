import {Workspace} from '../../workspace';

export interface TypeCheckOptions {
  heap?: number;
  watch?: boolean;
}

export interface TypeCheckHooks {}

export interface TypeCheckTask {
  hooks: TypeCheckHooks;
  options: TypeCheckOptions;
  workspace: Workspace;
}
