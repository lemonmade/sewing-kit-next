import {RunnerTasks} from '../../runner';
import {lazy} from '../utilities';
import {PLUGIN} from './common';

export default function typescript(tasks: RunnerTasks) {
  tasks.test.tapPromise(PLUGIN, lazy(() => import('./test')));
  tasks.build.tapPromise(PLUGIN, lazy(() => import('./build')));
  tasks.typeCheck.tapPromise(PLUGIN, lazy(() => import('./type-check')));
}
