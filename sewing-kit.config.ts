import {createWorkspace} from '@sewing-kit/config';
import {composePlugins} from '@sewing-kit/plugin-utilities';

import babel from '@sewing-kit/plugin-babel';
import eslint from '@sewing-kit/plugin-eslint';
import javascript from '@sewing-kit/plugin-javascript';
import typescript from '@sewing-kit/plugin-typescript';
import jest from '@sewing-kit/plugin-jest';
import packageBase from '@sewing-kit/plugin-package-base';
import packageBinaries from '@sewing-kit/plugin-package-binaries';
import packageCommonJS from '@sewing-kit/plugin-package-commonjs';
import packageTypeScript from '@sewing-kit/plugin-package-typescript';

const plugin = composePlugins('SewingKit.self', [
  babel,
  eslint,
  jest,
  javascript,
  typescript,
  packageBase,
  packageBinaries,
  packageCommonJS,
  packageTypeScript,
]);

export default createWorkspace((workspace) => {
  workspace.plugin(plugin);
});
