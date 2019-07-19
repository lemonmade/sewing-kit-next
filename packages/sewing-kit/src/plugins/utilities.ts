import {resolve, relative} from 'path';
import {exec} from 'child_process';

import {PackageBuild} from '../tasks/build';
import {Workspace, Package, PackageEntry, Project} from '../workspace';

export function lazy<T extends any[], R>(
  asyncImport: () => Promise<{default: (...args: T) => R}>,
) {
  return async (...args: T) => {
    return (await asyncImport()).default(...args);
  };
}

interface BabelConfig {
  presets?: (string | [string, object?])[];
}

const PRESET_MATCHER = /(babel-preset-shopify(?:\/[^\.]*)?)/;

function normalizePreset(preset: string) {
  const match = preset.match(PRESET_MATCHER);
  return match ? match[1].replace('/index', '') : preset;
}

function createCheck(test: string | string[]) {
  return (preset: string) => {
    const normalized = normalizePreset(preset);
    return typeof test === 'string'
      ? test === normalized
      : test.some((test) => test === normalized);
  };
}

export function changeBabelPreset(from: string | string[], to: string) {
  const check = createCheck(from);

  return ({presets = []}: BabelConfig) => {
    for (const [index, preset] of presets.entries()) {
      if (typeof preset === 'string') {
        if (check(preset)) {
          presets[index] = to;
        }
      } else if (check(preset[0])) {
        preset[0] = to;
      }
    }
  };
}

export function updateBabelPreset(match: string | string[], options: object) {
  const check = createCheck(match);

  return ({presets = []}: BabelConfig) => {
    for (const [index, preset] of presets.entries()) {
      if (typeof preset === 'string') {
        if (check(preset)) {
          presets[index] = [preset, options];
        }
      } else if (check(preset[0])) {
        preset[1] = {...preset[1], ...options};
      }
    }
  };
}

export function entryBuildRoot(
  entry: PackageEntry,
  pkg: Package,
  outputPath: string,
) {
  const sourceRoot = resolve(pkg.root, 'src');
  const relativeFromSourceRoot = relative(
    sourceRoot,
    resolve(sourceRoot, entry.root),
  );
  const destinationInOutput = resolve(outputPath, relativeFromSourceRoot);
  return normalizedRelative(pkg.root, destinationInOutput);
}

export class UpdatePackageJsonStep {
  constructor(
    private readonly project: Project,
    private readonly updates: {[key: string]: unknown},
  ) {}

  async run() {
    const {
      updates,
      project: {fs},
    } = this;

    const read = (await fs.hasFile('package.json'))
      ? JSON.parse(await fs.read('package.json'))
      : {};

    for (const [key, value] of Object.entries(updates)) {
      read[key] = value;
    }

    await fs.write('package.json', JSON.stringify(read, null, 2));
  }
}

interface WriteEntriesOptions {
  extension?: string;
  outputPath: string;
  contents(relativePath: string): string;
}

export class WriteEntriesStep {
  constructor(
    private packageBuild: PackageBuild,
    private options: WriteEntriesOptions,
  ) {}

  async run() {
    const {
      options: {extension = '.js', outputPath, contents},
      packageBuild: {pkg},
    } = this;

    const sourceRoot = resolve(pkg.root, 'src');

    for (const entry of pkg.entries) {
      const relativeFromSourceRoot = relative(
        sourceRoot,
        resolve(sourceRoot, entry.root),
      );
      const destinationInOutput = resolve(outputPath, relativeFromSourceRoot);
      const relativeFromRoot = normalizedRelative(
        pkg.root,
        destinationInOutput,
      );

      await pkg.fs.write(
        `${entry.name}${extension}`,
        contents(relativeFromRoot),
      );
    }
  }
}

interface CompileBabelOptions {
  configFile: string;
  outputPath: string;
}

export class CompileBabelStep {
  constructor(
    private packageBuild: PackageBuild,
    private workspace: Workspace,
    private options: CompileBabelOptions,
  ) {}

  async run(): Promise<void> {
    const {
      workspace,
      options: {configFile = 'babel.js', outputPath},
      packageBuild: {pkg, config},
    } = this;

    const babelConfigPath = workspace.sewingKit.configPath(
      `build/packages/${pkg.name}/${configFile}`,
    );

    await workspace.sewingKit.write(
      babelConfigPath,
      `module.exports=${JSON.stringify(
        await config.babel.promise({presets: []}),
      )};`,
    );

    const extensions = await config.extensions.promise([]);
    const sourceRoot = resolve(pkg.root, 'src');

    await new Promise((resolve, reject) => {
      exec(
        `node_modules/.bin/babel ${sourceRoot} --out-dir ${JSON.stringify(
          outputPath,
        )} --verbose --no-babelrc --extensions ${JSON.stringify(
          extensions.join(','),
        )} --config-file ${JSON.stringify(babelConfigPath)}`,
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });
  }
}

function normalizedRelative(from: string, to: string) {
  const rel = relative(from, to);
  return rel.startsWith('.') ? rel : `./${rel}`;
}