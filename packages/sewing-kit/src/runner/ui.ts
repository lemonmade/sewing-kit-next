import {clearLine, cursorTo} from 'readline';
import {link} from 'ansi-escapes';
import chalk from 'chalk';
import {supportsHyperlink} from 'supports-hyperlinks';

interface Options {
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;
}

class Formatter {
  readonly link: typeof link;

  constructor(stream: NodeJS.WriteStream) {
    this.link = supportsHyperlink(stream)
      ? link
      : (text, url) => `${text} (${url})`;
  }

  emphasis(text: string) {
    return chalk.bold(text);
  }

  code(text: string) {
    return chalk.gray(text);
  }

  info(text: string) {
    return chalk.cyan(text);
  }

  success(text: string) {
    return chalk.green(text);
  }

  failure(text: string) {
    return chalk.red(text);
  }
}

interface LogFunction {
  (format: Formatter): string;
}

type Loggable = LogFunction | string;

class FormattedStream {
  private readonly formatter: Formatter;

  constructor(private readonly stream: NodeJS.WriteStream) {
    this.formatter = new Formatter(stream);
  }

  write(value: Loggable) {
    const logged =
      typeof value === 'function' ? value(this.formatter) : String(value);

    this.stream.write(logged);
  }

  clear() {
    clearLine(this.stream, 0);
    cursorTo(this.stream, 0);
  }
}

export class Ui {
  readonly stdout: FormattedStream;
  readonly stderr: FormattedStream;

  constructor({
    stdout = process.stdout,
    stderr = process.stderr,
  }: Partial<Options> = {}) {
    this.stdout = new FormattedStream(stdout);
    this.stderr = new FormattedStream(stderr);
  }

  async spin(_label: Loggable, wait: () => void) {
    await wait();
  }

  log(value: Loggable) {
    this.stdout.write(value);
    this.stdout.write('\n');
  }

  error(value: Loggable) {
    this.stderr.write(value);
    this.stderr.write('\n');
  }
}
