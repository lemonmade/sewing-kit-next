const {readdirSync, existsSync} = require('fs');
const path = require('path');

const moduleNameMapper = getPackageNames().reduce((accumulator, name) => {
  const scopedName = `@shopify/${name}`;
  accumulator[scopedName] = `<rootDir>/../${name}/src/index.ts`;
  return accumulator;
}, {});

module.exports = function jestConfigFactory(dirname) {
  return {
    collectCoverage: false,
    displayName: dirname.split('/').pop(),
    moduleDirectories: [
      'node_modules',
      '<rootDir>',
      path.join(__dirname, 'node_modules'),
    ],
    moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
    moduleNameMapper,
    rootDir: '.',
    testRegex: '.*\\.test\\.tsx?$',
    testEnvironment: 'node',
    testEnvironmentOptions: {
      url: 'http://localhost:3000/',
    },
    watchPathIgnorePatterns: ['/fixtures/'],
  };
};

function getPackageNames() {
  const packagesPath = path.join(__dirname, 'packages');
  return readdirSync(packagesPath).filter((packageName) => {
    const packageJSONPath = path.join(
      packagesPath,
      packageName,
      'package.json',
    );
    return existsSync(packageJSONPath);
  });
}
