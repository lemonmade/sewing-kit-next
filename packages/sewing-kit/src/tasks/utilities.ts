import {kebab} from 'change-case';

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
