import {withWorkspace} from './utilities';
import {Work} from '../src/concepts';

describe('sewing-kit', () => {
  it('auto-detects a client bundle in the client entrypoint', async () => {
    await withWorkspace('simple-client', async (workspace) => {
      await workspace.writeFile(
        'client/index.ts',
        `
          function main(message: string) {
            console.log(message);
          }

          main('Hello, world!');
        `,
      );

      await workspace.run({root: workspace.directory, plugins: [debugPlugin]});

      expect(await workspace.contents('build/browser/main/main.js')).toContain(
        'function main(message) {',
      );
    });
  });
});

function debugPlugin(work: Work) {
  work.hooks.build.tap('debug', (build) => {
    build.hooks.config.tap('debug', (config) => {
      // console.log(JSON.stringify(config, null, 2));

      return config;
    });
  });
}
