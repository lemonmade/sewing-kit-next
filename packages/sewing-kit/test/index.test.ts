import {withWorkspace} from './utilities';
import {Work} from '../src/work';

describe('sewing-kit', () => {
  describe.skip('packages', () => {
    it('detects a package in /src', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        await workspace.writeFile(
          'src/index.ts',
          `
            export function pkg() {
              console.log('Hello, world!');
            }
          `,
        );

        await workspace.run({root: workspace.directory});

        expect(await workspace.contents('__dist__/index.js')).toContain(
          'export function pkg()',
        );
      });
    });
  });

  it('auto-detects a client bundle in /client', async () => {
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

      // workspace.debug();

      expect(
        await workspace.contents(
          'build/browser/main/browserTarget/baseline/main.js',
        ),
      ).toContain('function main(message) {');
    });
  });
});

function debugPlugin(work: Work) {
  work.tasks.build.tap('debug', (buildTask) => {
    buildTask.configure.common.tap('debug', (configuration) => {
      configuration.finalize.tap('debug', (config) => {
        // console.log(JSON.stringify(config, null, 2));

        return config;
      });
    });
  });
}
