export interface Step {
  run(
    ui: import('./ui').Ui,
    runner: import('./runner').StepRunner,
  ): void | Promise<void>;
}

export function createStep(run: Step['run']): Step {
  return {run};
}
