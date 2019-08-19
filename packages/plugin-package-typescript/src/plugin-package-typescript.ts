import {resolve, relative} from 'path';
import {copy} from 'fs-extra';
import {Package} from '@sewing-kit/core';
import {createStep, DiagnosticError} from '@sewing-kit/ui';
import {createRootPlugin} from '@sewing-kit/plugin-utilities';
import {} from '@sewing-kit/plugin-package-base';

const PLUGIN = 'SewingKit.package-esnext';
const VARIANT = 'esnext';

declare module '@sewing-kit/types' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

export default createRootPlugin(PLUGIN, (tasks) => {
  tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
    hooks.configure.tap(PLUGIN, (hooks) => {
      if (hooks.packageBuildArtifacts) {
        hooks.packageBuildArtifacts.tapPromise(PLUGIN, async (artifacts) => [
          ...artifacts,
          ...(await Promise.all(
            workspace.packages.map((pkg) => pkg.fs.glob('./*.d.ts')),
          )).flat(),
        ]);
      }
    });

    // We don’t build TypeScript definitions for projects that also include
    // web apps/ services.
    if (workspace.private) {
      return;
    }

    hooks.package.tapPromise(PLUGIN, async ({pkg, hooks}) => {
      const allTsFiles = await pkg.fs.glob('src/**/*.ts');
      const definitionFiles = allTsFiles.filter((file) =>
        file.endsWith('.d.ts'),
      );

      if (
        allTsFiles.length === 0 ||
        definitionFiles.length !== allTsFiles.length
      ) {
        hooks.steps.tap(PLUGIN, (steps) => [
          ...steps,
          createStep({label: 'Copying type definitions to root'}, async () => {
            await copy(pkg.fs.resolvePath('src'), pkg.fs.root);
          }),
        ]);
      }
    });

    hooks.pre.tap(PLUGIN, (steps) => [
      ...steps,
      createStep({label: 'Compiling TypeScript definitions'}, async (step) => {
        try {
          await Promise.all(workspace.packages.map(writeTypeScriptEntries));
          await step.exec('node_modules/.bin/tsc', ['--build']);
        } catch (error) {
          throw new DiagnosticError({message: error.all});
        }
      }),
    ]);
  });
});

async function writeTypeScriptEntries(pkg: Package) {
  const outputPath = await getOutputPath(pkg);

  const sourceRoot = pkg.fs.resolvePath('src');

  for (const entry of pkg.entries) {
    const relativeFromSourceRoot = relative(
      sourceRoot,
      pkg.fs.resolvePath(entry.root),
    );
    const destinationInOutput = resolve(outputPath, relativeFromSourceRoot);
    const relativeFromRoot = normalizedRelative(pkg.root, destinationInOutput);

    await pkg.fs.write(
      `${entry.name || 'index'}.d.ts`,
      `export * from ${JSON.stringify(
        relativeFromRoot,
      )};\nexport {default} from ${JSON.stringify(relativeFromRoot)};`,
    );
  }
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

function normalizedRelative(from: string, to: string) {
  const rel = relative(from, to);
  return rel.startsWith('.') ? rel : `./${rel}`;
}
