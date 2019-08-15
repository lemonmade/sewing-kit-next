import {RunnerTasks} from '@sewing-kit/core';
import {kebab} from 'change-case';

type OptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never
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

export function createRootPlugin(
  _name: string,
  run: (tasks: RunnerTasks) => void,
) {
  return run;
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
