import 'core-js/features/array/flat';
import 'core-js/features/array/flat-map';

import {build} from './build';
import {test} from './test';
import {lint} from './lint';
import {typeCheck} from './type-check';

const commands = new Map([
  ['build', build],
  ['test', test],
  ['lint', lint],
  ['type-check', typeCheck],
]);

run();

async function run() {
  try {
    const [, , ...args] = process.argv;
    const [command, ...argv] = args;
    const commandModule = commands.get(command);

    if (commandModule) {
      await commandModule(argv);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Command not found: ${command} (${argv.join(' ')})`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.log(error.stack);
    process.exitCode = 1;
  }
}
