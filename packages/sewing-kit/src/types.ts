export enum Env {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
  Test = 'test',
}

export interface BabelConfig {
  presets?: (string | [string, object?])[];
  plugins?: string[];
}

export interface Step {
  run(): Promise<void>;
}
