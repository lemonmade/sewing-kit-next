import {AsyncSeriesHook} from 'tapable';

import {Ui} from './ui';
import {Step} from './steps';
import {DiagnosticError} from './errors';

export interface RunnerTasks {
  readonly discovery: AsyncSeriesHook<
    import('../tasks/discovery').DiscoveryTask
  >;
  readonly build: AsyncSeriesHook<import('../tasks/build').BuildTask>;
  readonly test: AsyncSeriesHook<import('../tasks/testing').TestTask>;
  readonly lint: AsyncSeriesHook<import('../tasks/lint').LintTask>;
  readonly typeCheck: AsyncSeriesHook<
    import('../tasks/type-check').TypeCheckTask
  >;
}

export interface StepRunner {
  run(steps: Step[]): Promise<void>;
}

export class Runner {
  readonly tasks: RunnerTasks = {
    discovery: new AsyncSeriesHook<import('../tasks/discovery').DiscoveryTask>([
      'workspaceTask',
    ]),
    build: new AsyncSeriesHook<import('../tasks/build').BuildTask>([
      'buildTask',
    ]),
    test: new AsyncSeriesHook<import('../tasks/testing').TestTask>([
      'testTask',
    ]),
    lint: new AsyncSeriesHook<import('../tasks/lint').LintTask>(['lintTask']),
    typeCheck: new AsyncSeriesHook<import('../tasks/type-check').TypeCheckTask>(
      ['typeCheckTask'],
    ),
  };

  constructor(private readonly ui: Ui) {}

  async run(steps: Step[]) {
    const {ui} = this;
    const stepRunner: StepRunner = {
      run: (steps) => {
        return this.run(steps);
      },
    };

    try {
      for (const step of steps) {
        await step.run(ui, stepRunner);
      }
    } catch (error) {
      if (error instanceof DiagnosticError) {
        ui.error(error.message);
      } else {
        ui.error(
          (fmt) =>
            `🧵 The following unexpected error occurred. We want to provide more useful suggestions when errors occur, so please open an issue on ${fmt.link(
              'the sewing-kit repo',
              'https://github.com/Shopify/sewing-kit',
            )} so that we can improve this message. Command: \`${process.argv.join(
              ' ',
            )}\`.\n`,
        );
        // ui.log(error.message);

        if (error.all == null) {
          ui.error(error.stack);
        } else {
          ui.error(error.all);
        }
      }

      process.exitCode = 1;
    }
  }
}