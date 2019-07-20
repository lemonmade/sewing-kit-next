import {createTransformer} from 'babel-jest';

module.exports = createTransformer({
  presets: [['babel-preset-shopify/node', {modules: 'commonjs'}]],
});
