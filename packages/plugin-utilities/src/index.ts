import {PluginTargetMap} from '@sewing-kit/core';
import {DiagnosticError} from '@sewing-kit/ui';
import {PluginTarget, PLUGIN} from '@sewing-kit/types';
import {kebab} from 'change-case';

export {PluginTarget};

type Arguments<T> = T extends (...args: infer U) => any ? U : never;

export class MissingPluginError extends DiagnosticError {
  constructor(plugin: string) {
    super({
      title: `Missing hooks provided by ${plugin}`,
      suggestion: (fmt) =>
        fmt`Run {command yarn add ${plugin}}, import it into your sewing-kit config file, and include it using the {code plugins} option.`,
    });
  }
}

type OptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

type HookAdder<T> = () => {[K in OptionalKeys<T>]?: T[K]};

export function addHooks<T>(adder: HookAdder<T>): (hooks: T) => void {
  return (hooks) => {
    Object.assign(hooks, adder());
  };
}

export function compose<T extends (...args: any[]) => void>(...funcs: T[]): T {
  return ((...args: any[]) => {
    for (const func of funcs) {
      func(...args);
    }
  }) as any;
}

interface CreatePluginOptions<T extends PluginTarget> {
  id: string;
  target: T;
}

export function createPlugin<T extends PluginTarget>(
  {id, target}: CreatePluginOptions<T>,
  run: (
    ...args: Arguments<PluginTargetMap[T]>
  ) => ReturnType<PluginTargetMap[T]>,
): PluginTargetMap[T] {
  Object.defineProperties(run, {
    id: {value: id},
    target: {value: target},
    [PLUGIN]: {value: true},
  });

  return run as any;
}

export function toArgs(flags: object, {dasherize = false} = {}) {
  return Object.entries(flags).reduce<string[]>((all, [key, value]) => {
    const newArgs: string[] = [];
    const normalizedKey = dasherize ? kebab(key) : key;

    if (typeof value === 'boolean') {
      if (value) {
        newArgs.push(`--${normalizedKey}`);
      }
    } else if (Array.isArray(value)) {
      newArgs.push(
        ...value.flatMap((subValue) => [
          `--${normalizedKey}`,
          String(subValue),
        ]),
      );
    } else if (value != null) {
      newArgs.push(`--${normalizedKey}`, String(value));
    }

    return [...all, ...newArgs];
  }, []);
}

export function lazy<T extends any[], R>(
  asyncImport: () => Promise<{default: (...args: T) => R}>,
) {
  return async (...args: T) => {
    return (await asyncImport()).default(...args);
  };
}
