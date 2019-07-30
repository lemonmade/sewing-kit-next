import {Work} from '../work';
import * as plugins from '../plugins';

const DEFAULT_PLUGINS = Object.values(plugins);

export interface Options {
  root?: string;
  argv: string[];
}

export function loadWork() {
  const work = new Work();

  for (const plugin of DEFAULT_PLUGINS) {
    plugin.call(work, work);
  }

  return work;
}
