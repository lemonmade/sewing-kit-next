import {join} from 'path';
import {pathExists} from 'fs-extra';

export async function loadConfig(root: string) {
  if (await pathExists(join(root, 'sewing-kit.config.js'))) {
    return defaultOrCommonJsExport(
      require(join(root, 'sewing-kit.config.js')),
    )();
  }

  if (await pathExists(join(root, 'sewing-kit.config.ts'))) {
    require('@babel/register')({
      extensions: ['.mjs', '.js', '.ts', '.tsx'],
      presets: [['babel-preset-shopify/node', {typescript: true}]],
    });

    return defaultOrCommonJsExport(
      require(join(root, 'sewing-kit.config.ts')),
    )();
  }

  return {};
}

function defaultOrCommonJsExport(module: any) {
  return module.default || module;
}
