import {resolve} from 'path';
import {withWorkspace} from './utilities';

describe('sewing-kit', () => {
  describe('packages', () => {
    it('detects a package in /src', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        await workspace.writeFile(
          'src/index.ts',
          `
            export function pkg(greet: string) {
              console.log(\`Hello, \${greet}!\`);
            }
          `,
        );

        await workspace.run('build');

        expect(await workspace.contents('build/esm/index.js')).toContain(
          'export function pkg(',
        );
      });
    });

    it.only('allows customization of the entrypoint for a package', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        await workspace.writeFile(
          'src/custom.ts',
          `
            export function pkg(greet: string) {
              console.log(\`Hello, \${greet}!\`);
            }
          `,
        );

        await workspace.writeFile(
          'sewing-kit.config.ts',
          `
            import {createPackage} from ${JSON.stringify(
              resolve(__dirname, '../src/index'),
            )};
            export default createPackage((pkg) => {
              pkg.entry({root: 'src/custom'});
            });
          `,
        );

        await workspace.run('build');

        workspace.debug();

        expect(await workspace.contents('index.js')).toContain(
          'module.exports = require("./build/cjs/custom")',
        );
      });
    });

    it('detects packages in /packages', async () => {
      await withWorkspace('monorepo-package', async (workspace) => {
        await workspace.writeFile(
          'packages/one/src/index.ts',
          `export function one() {}`,
        );

        await workspace.writeFile(
          'packages/two/src/index.ts',
          `export function two() {}`,
        );

        await workspace.run('build');

        expect(
          await workspace.contents('packages/one/build/esm/index.js'),
        ).toContain('export function one(');

        expect(
          await workspace.contents('packages/two/build/esm/index.js'),
        ).toContain('export function two(');
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

      await workspace.run('build');

      expect(
        await workspace.contents('build/browser/baseline/main.js'),
      ).toContain('function main(message) {');
    });
  });
});
