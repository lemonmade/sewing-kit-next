import {createRootPlugin, lazy} from '@sewing-kit/plugin-utilities';
import {PLUGIN} from './common';

export default createRootPlugin(PLUGIN, (tasks) => {
  tasks.discovery.tapPromise(PLUGIN, lazy(() => import('./discovery')));
  tasks.test.tapPromise(PLUGIN, lazy(() => import('./test')));
});
