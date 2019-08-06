import {Ui} from './ui';

export interface Step {
  run(ui: Ui): void | Promise<void>;
}

export function createStep(run: Step['run']): Step {
  return {run};
}
