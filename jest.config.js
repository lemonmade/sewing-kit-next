module.exports = {
  projects: ['<rootDir>packages/*/jest.config.js'],
  watchPlugins: ['jest-watch-yarn-workspaces'],
  watchPathIgnorePatterns: ['/fixtures/', '/tmp/'],
};
