// We want sewing-kit to be able to build itself. Unfortunately, when cloning
// this repo for the first time, there are some problems with doing so. First
// and foremost is the problem that, even if we use babel-node to run the CLI
// from /packages/cli/src, that command will attempt to read the various
// sewing-kit.config.ts files, which generally import from /packages/config,
// which doesn't exist yet. Classic chicken and egg problem!
//
// To address this case, we write a tiny index file at the root of each package
// that points to the source, rather than the compiled output. Since we run with
// babel-node, this entry will be enough to make everything resolve properly.

const {join, basename} = require('path');
const {writeFileSync, unlinkSync} = require('fs');
const {sync: glob} = require('glob');

for (const file of glob('packages/*/*.{js,mjs,node,esnext,ts}', {
  ignore: '**/sewing-kit.config.*',
})) {
  unlinkSync(file);
}

const CUSTOM_ENTRIES = new Map([['config', ['index', 'load']]]);

const jsExport = (name = 'index') =>
  `module.exports = require("./src/${name}");`;

const tsExport = (name = 'index') =>
  `export * from "./build/ts/${name}";\nexport {default} from "./build/ts/${name}";`;

for (const pkgRoot of glob('packages/*/')) {
  for (const entry of CUSTOM_ENTRIES.get(basename(pkgRoot)) || ['index']) {
    writeFileSync(join(pkgRoot, `${entry}.js`), jsExport(entry));
    writeFileSync(join(pkgRoot, `${entry}.d.ts`), tsExport(entry));
  }
}
