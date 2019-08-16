import exec from 'execa';

import {Ui, Loggable} from './ui';
import {Step} from './steps';
import {DiagnosticError} from './errors';

export interface NestedStepRunner {
  ui: Ui;
  exec: typeof exec;
  run(steps: Step[]): Promise<void>;
}

enum StepState {
  InProgress,
  Failure,
  Success,
  Pending,
}

type Update = () => void;

const symbols = '⠄⠆⠇⠋⠙⠸⠰⠠⠰⠸⠙⠋⠇⠆';

class StepRunner {
  private state = StepState.Pending;
  private readonly stepRunners: StepRunner[] = [];

  constructor(private readonly step: Step, private readonly update: Update) {}

  async run(ui: Ui) {
    this.setState(StepState.InProgress);

    try {
      const runner = {
        ui,
        exec,
        run: async (steps: Step[]) => {
          for (const step of steps) {
            const stepRunner = new StepRunner(step, this.update);
            this.stepRunners.push(stepRunner);
          }

          for (const stepRunner of this.stepRunners) {
            await stepRunner.run(ui);
          }
        },
      };

      await this.step.run(runner);
      this.setState(StepState.Success);
    } catch (error) {
      this.setState(StepState.Failure);
      throw error;
    }
  }

  toString(tick: number): Loggable {
    if (this.step.label == null || this.step.indefinite) {
      return '';
    }

    return (fmt) => {
      let prefix = '';

      switch (this.state) {
        case StepState.InProgress:
          prefix = fmt`{info ${symbols[tick % symbols.length]}}`;
          break;
        case StepState.Success:
          prefix = fmt`{success ✓}`;
          break;
        case StepState.Failure:
          prefix = fmt`{error o}`;
          break;
        case StepState.Pending:
          prefix = fmt`{subdued o}`;
          break;
      }

      const ownLine = fmt`${prefix} ${fmt`${this.step.label || ''}`}`;

      if (this.state !== StepState.InProgress) {
        return ownLine;
      }

      const childLines = this.stepRunners
        .map((step) => fmt`${step.toString(tick)}`)
        .filter(Boolean);
      return `${ownLine}${childLines.length > 0 ? '\n  ' : ''}${childLines.join(
        '\n  ',
      )}`;
    };
  }

  private setState(state: StepState) {
    this.state = state;
    this.update();
  }
}

class StepGroupRunner {
  readonly stepRunners: StepRunner[] = [];

  constructor(
    private readonly steps: Step[],
    private readonly update: Update,
  ) {}

  async run(ui: Ui) {
    for (const step of this.steps) {
      this.stepRunners.push(new StepRunner(step, this.update));
    }

    for (const step of this.stepRunners) {
      await step.run(ui);
    }
  }

  toString(tick: number): Loggable {
    return (fmt) =>
      this.stepRunners
        .map((step) => fmt`${step.toString(tick)}`)
        .filter(Boolean)
        .join('\n');
  }
}

class RunnerUi {
  private tick = 0;
  private groupRunners: StepGroupRunner[] = [];
  private lastContentHeight = 0;

  constructor(private readonly groups: Step[][], private readonly ui: Ui) {}

  async run() {
    for (const group of this.groups) {
      this.groupRunners.push(new StepGroupRunner(group, this.update));
    }

    const frame = () => {
      this.update();
      this.tick += 1;
    };

    const interval: any = setInterval(frame, 60);
    const immediate = setImmediate(frame);

    try {
      for (const groupRunner of this.groupRunners) {
        await groupRunner.run(this.ui);
      }
    } finally {
      clearInterval(interval);
      clearImmediate(immediate);
      this.update();

      if (this.lastContentHeight > 0) {
        this.ui.stdout.write('\n');
      }
    }
  }

  private update = () => {
    const content = this.ui.stdout.stringify((fmt) =>
      this.groupRunners
        .map((group) => fmt`${group.toString(this.tick)}`)
        .filter(Boolean)
        .join('\n\n'),
    );

    this.ui.stdout.moveCursor(0, -1 * Math.max(0, this.lastContentHeight - 1));
    this.ui.stdout.clearDown();
    this.ui.stdout.write(content);

    this.lastContentHeight = content.split('\n').length;
  };
}

export async function run(
  steps: Step[],
  {
    ui,
    pre = [],
    post = [],
    title,
  }: {ui: Ui; pre?: Step[]; post?: Step[]; title?: string},
) {
  const runnerUi = new RunnerUi([pre, steps, post], ui);

  try {
    if (title) {
      ui.log((fmt) => fmt`🧵 {emphasis ${title}}\n`);
    }

    await runnerUi.run();
  } catch (error) {
    if (error instanceof DiagnosticError) {
      ui.error(error.message);

      if (error.suggestion) {
        ui.error(error.suggestion);
      }
    } else {
      ui.error(
        (fmt) =>
          fmt`🧵 The following unexpected error occurred. We want to provide more useful suggestions when errors occur, so please open an issue on {link the sewing-kit repo https://github.com/Shopify/sewing-kit} so that we can improve this message.`,
      );
      // ui.log(error.message);

      if (error.all == null) {
        ui.error(error.stack);
      } else {
        ui.error(error.all);
        ui.error(error.stack);
      }
    }

    process.exitCode = 1;
  }
}
