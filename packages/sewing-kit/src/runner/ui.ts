import {link} from 'ansi-escapes';
import {supportsHyperlink} from 'supports-hyperlinks';

interface Options {
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;
}

interface Formatter {
  link(text: string, url: string): string;
}

interface LogFunction {
  (format: Formatter): string;
}

export class Ui {
  private stdin: Options['stdin'];
  private stdout: Options['stdout'];
  private stderr: Options['stderr'];

  constructor({
    stdin = process.stdin,
    stdout = process.stdout,
    stderr = process.stderr,
  }: Partial<Options> = {}) {
    this.stdin = stdin;
    this.stdout = stdout;
    this.stderr = stderr;
  }

  log(value: LogFunction | string) {
    const logged =
      typeof value === 'function'
        ? value({
            link: (text, url) =>
              supportsHyperlink(this.stdout)
                ? link(text, url)
                : `${text} (${url})`,
          })
        : String(value);

    this.stdout.write(`${logged}\n`);
  }
}
