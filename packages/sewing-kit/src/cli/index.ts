import 'core-js/features/array/flat';
import 'core-js/features/array/flat-map';

import {build} from './build';
import {test} from './test';

const commands = new Map([['build', build], ['test', test]]);

run();

async function run() {
  const [, , ...args] = process.argv;
  const [command, ...rest] = args;
  const commandModule = commands.get(command);

  if (commandModule) {
    await commandModule({argv: rest});
  } else {
    console.log(`Command not found: ${command} (${rest.join(' ')})`);
    process.exitCode = 1;
  }
}
