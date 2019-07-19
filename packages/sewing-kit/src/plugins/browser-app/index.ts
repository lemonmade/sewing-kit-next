import {Work} from '../../work';
import {lazy} from '../utilities';
import {PLUGIN} from './common';

export default function browserApp(work: Work) {
  work.tasks.discovery.tapPromise(PLUGIN, lazy(() => import('./discovery')));
  work.tasks.build.tapPromise(PLUGIN, lazy(() => import('./build')));
}
