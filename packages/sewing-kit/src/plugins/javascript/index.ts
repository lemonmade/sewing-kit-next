import {RunnerTasks} from '../../runner';
import {lazy} from '../utilities';
import {PLUGIN} from './common';

export default function javascript(tasks: RunnerTasks) {
  tasks.test.tapPromise(PLUGIN, lazy(() => import('./test')));
  tasks.build.tapPromise(PLUGIN, lazy(() => import('./build')));
}
