import {FirstArgument} from '@shopify/useful-types';

export interface Step {
  label?: FirstArgument<import('./ui').Ui['log']>;
  indefinite?: boolean;
  run(
    ui: import('./ui').Ui,
    runner: import('./runner').NestedStepRunner,
  ): void | Promise<void>;
}

export function createStep(run: Step['run']): Step;
export function createStep(options: Omit<Step, 'run'>, run: Step['run']): Step;
export function createStep(
  runOrStep: Step['run'] | Omit<Step, 'run'>,
  run?: Step['run'],
) {
  return typeof runOrStep === 'function'
    ? {run: runOrStep}
    : {run, ...runOrStep};
}
