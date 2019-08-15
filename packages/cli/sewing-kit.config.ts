import {createPackage, Runtime} from 'sewing-kit-of-lemons';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.binary({name: 'sewing-kit', root: './src/index', aliases: ['sk']});
});
