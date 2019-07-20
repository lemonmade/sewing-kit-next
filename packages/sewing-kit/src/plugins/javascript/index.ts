import {Work} from '../../work';
import {lazy} from '../utilities';
import {PLUGIN} from './common';

export default function javascript(work: Work) {
  work.tasks.test.tapPromise(PLUGIN, lazy(() => import('./test')));
  work.tasks.build.tapPromise(PLUGIN, lazy(() => import('./build')));
}
