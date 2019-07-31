import {Work} from '../../work';
import {Package} from '../../workspace';
import {WriteEntriesStep} from '../utilities';

const PLUGIN = 'SewingKit.package-typescript';

export default function packageTypeScript(work: Work) {
  work.tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
    // We don’t build TypeScript definitions for projects that also include
    // web apps/ services.
    if (workspace.private) {
      return;
    }

    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.steps.tapPromise(PLUGIN, async (steps) => [
        ...steps,
        new WriteEntriesStep(pkg, {
          outputPath: await getOutputPath(pkg),
          extension: '.d.ts',
          contents: (relative) => `export * from ${JSON.stringify(relative)};`,
        }),
      ]);
    });

    hooks.pre.tap(PLUGIN, (steps) => [
      ...steps,
      {
        async run() {
          const {default: exec} = await import('execa');
          try {
            const result = await exec('node_modules/.bin/tsc', ['--build']);
            // eslint-disable-next-line no-console
            console.log(result.all);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(error.all);
            process.exitCode = 1;
          }
        },
      },
    ]);
  });
}

async function getOutputPath(pkg: Package) {
  if (await pkg.fs.hasFile('tsconfig.json')) {
    try {
      // eslint-disable-next-line typescript/no-var-requires
      const tsconfig = require(pkg.fs.resolvePath('tsconfig.json'));
      const relativePath =
        (tsconfig.compilerOptions && tsconfig.compilerOptions.outDir) ||
        'build/ts';

      return pkg.fs.resolvePath(relativePath);
    } catch {
      // Fall through to the default below
    }
  }

  return pkg.fs.resolvePath('build/ts');
}
