import {link} from 'ansi-escapes';
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

    this.stream.write(`${logged}\n`);
  }
}

export class Ui {
  private readonly stdout: FormattedStream;
  private readonly stderr: FormattedStream;

  constructor({
    stdout = process.stdout,
    stderr = process.stderr,
  }: Partial<Options> = {}) {
    this.stdout = new FormattedStream(stdout);
    this.stderr = new FormattedStream(stderr);
  }

  async spin(label: Loggable, wait: () => void) {
    this.log(label);
    await wait();
    this.log(
      (...args) =>
        `${typeof label === 'function' ? label(...args) : label} finished`,
    );
  }

  log(value: Loggable) {
    this.stdout.write(value);
  }

  error(value: Loggable) {
    this.stderr.write(value);
  }
}
