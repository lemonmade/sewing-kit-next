import {createRootPlugin, lazy} from '@sewing-kit/plugin-utilities';
import {PLUGIN} from './common';

export default createRootPlugin(PLUGIN, (tasks) => {
  tasks.test.tapPromise(PLUGIN, lazy(() => import('./test')));
  tasks.build.tapPromise(PLUGIN, lazy(() => import('./build')));
  tasks.lint.tapPromise(PLUGIN, lazy(() => import('./lint')));
});
