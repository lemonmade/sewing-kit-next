import {createPackage, Runtime} from 'sewing-kit-of-lemons';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.entry({root: './src'});
  pkg.binary({name: 'sewing-kit', root: './src/cli', aliases: ['sk']});
});
