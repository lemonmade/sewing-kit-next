import {Step} from '@sewing-kit/types';

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
