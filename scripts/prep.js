// We want sewing-kit to be able to build itself. Unfortunately, when cloning
// this repo for the first time, there are some problems with doing so. First
// and foremost is the problem that, even if we use babel-node to run the CLI
// from /packages/sewing-kit/src, that command will attempt to read the
// sewing-kit.config.ts file of sewing-kit itself, which tries to import
// from sewing-kit, which doesn't exist yet. Classic chicken and egg problem!
//
// To address this case, we write a tiny index file at the root of sewing-kit
// that simply points the index for the package back into /packages/sewing-kit/src.
// Babel-node can then do the rest, as it knows how to import .ts files. Once
// the package is built the first time, /packages/sewing-kit/index.js is then
// overwritten with a file that points the entry of the package to be the compiled
// entry, which will satisfy the needs of the sewing-kit.config.ts file just fine.

const {writeFileSync} = require('fs');

writeFileSync(
  'packages/sewing-kit/index.js',
  'module.exports = require("./src")',
);
