import {Package} from '@sewing-kit/core';
import {createStep, DiagnosticError} from '@sewing-kit/ui';
import {createRootPlugin} from '@sewing-kit/plugin-utilities';
import {createWriteEntriesStep} from '@sewing-kit/plugin-package-utilities';

const PLUGIN = 'SewingKit.package-esnext';
const VARIANT = 'esnext';

declare module '@sewing-kit/core/build/ts/tasks/build/types' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

export default createRootPlugin(PLUGIN, (tasks) => {
  tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
    // We don’t build TypeScript definitions for projects that also include
    // web apps/ services.
    if (workspace.private) {
      return;
    }

    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.steps.tapPromise(PLUGIN, async (steps) => [
        ...steps,
        createWriteEntriesStep(pkg, {
          outputPath: await getOutputPath(pkg),
          extension: '.d.ts',
          contents: (relative) => `export * from ${JSON.stringify(relative)};`,
        }),
      ]);
    });

    hooks.pre.tap(PLUGIN, (steps) => [
      ...steps,
      createStep({label: 'Compiling TypeScript definitions'}, async (step) => {
        try {
          await step.exec('node_modules/.bin/tsc', ['--build']);
        } catch (error) {
          throw new DiagnosticError({message: error.all});
        }
      }),
    ]);
  });
});

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
