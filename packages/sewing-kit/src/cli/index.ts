import 'core-js/features/array/flat';
import 'core-js/features/array/flat-map';

import {build} from './build';
import {test} from './test';
import {lint} from './lint';

const commands = new Map([['build', build], ['test', test], ['lint', lint]]);

run();

async function run() {
  const [, , ...args] = process.argv;
  const [command, ...rest] = args;
  const commandModule = commands.get(command);

  if (commandModule) {
    await commandModule({argv: rest});
  } else {
    // eslint-disable-next-line no-console
    console.log(`Command not found: ${command} (${rest.join(' ')})`);
    process.exitCode = 1;
  }
}
