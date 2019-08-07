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

class StepUi {
  constructor(private ui: Ui) {}

  toString() {}

  done(sucess = true) {}
}

class RunnerUi {
  private interval: any;
  private spinnerIndex = 0;
  private steps: StepUi[] = [];
  private lastContentHeight = 0;

  constructor(private readonly ui: Ui) {}

  start() {
    this.interval = setTimeout(this.update, 60);
  }

  private update = () => {
    this.ui.stdout.clear();
  };
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

  async run(steps: Step[], root = true) {
    const {ui} = this;
    const stepRunner: StepRunner = {
      run: (steps) => {
        return this.run(steps, false);
      },
    };

    let currentIndex = 0;
    let label: any;
    let interval: any;
    const symbols = '⠄⠆⠇⠋⠙⠸⠰⠠⠰⠸⠙⠋⠇⠆';
    const indent = root ? '' : '   ';
    const update = () => {
      ui.stdout.clear();
      ui.stdout.write(
        (fmt) =>
          `${indent}${fmt.info(symbols[currentIndex])} ${
            typeof label === 'function' ? label(fmt) : label
          }`,
      );
    };

    const iteration = () => {
      update();
      currentIndex = (currentIndex + 1) % symbols.length;
    };

    if (root) {
      iteration();
      interval = setInterval(iteration, 60);
    }

    try {
      for (const step of steps) {
        label = step.label;

        if (label) {
          update();
        }

        await step.run(ui, stepRunner);

        if (label) {
          ui.stdout.clear();
          ui.log(
            (fmt) =>
              `${indent}${fmt.success('✓')} ${
                typeof step.label === 'function' ? step.label(fmt) : step.label
              }`,
          );
        }
      }

      if (interval) {
        clearInterval(interval);
      }
    } catch (error) {
      clearInterval(interval);

      if (error instanceof DiagnosticError) {
        ui.error(error.message);

        if (error.suggestion) {
          ui.error(error.suggestion);
        }
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
