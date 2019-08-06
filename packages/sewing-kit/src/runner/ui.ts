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

class FormattedStream {
  private readonly formatter: Formatter;

  constructor(private readonly stream: NodeJS.WriteStream) {
    this.formatter = new Formatter(stream);
  }

  write(value: LogFunction | string) {
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

  log(value: LogFunction | string) {
    this.stdout.write(value);
  }

  error(value: LogFunction | string) {
    this.stderr.write(value);
  }
}
