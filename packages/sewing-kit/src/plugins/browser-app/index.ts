import {RunnerTasks} from '../../runner';
import {lazy} from '../utilities';
import {PLUGIN} from './common';

export default function browserApp(tasks: RunnerTasks) {
  tasks.discovery.tapPromise(PLUGIN, lazy(() => import('./discovery')));
  tasks.build.tapPromise(PLUGIN, lazy(() => import('./build')));
}
