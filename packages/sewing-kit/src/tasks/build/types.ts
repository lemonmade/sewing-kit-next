import {WebApp, Package} from '../../workspace';
import {Env} from '../../types';
import {Variant} from './variants';

export interface Environment {
  readonly actual: Env;
  readonly simulate: Env;
}

export interface BrowserBuildVariants {}

export interface WebAppBuild {
  readonly app: WebApp;
  readonly variant: Variant<BrowserBuildVariants>;
}

export interface PackageBuildVariants {}

export interface PackageBuild {
  readonly pkg: Package;
  readonly variant: Variant<PackageBuildVariants>;
}
