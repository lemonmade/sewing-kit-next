import {PLUGIN} from './common';

export default function lintJavaScript({
  hooks,
}: import('../../tasks/lint').LintTask) {
  hooks.configure.tap(PLUGIN, (hooks) => {
    if (hooks.eslintExtensions) {
      hooks.eslintExtensions.tap(PLUGIN, (extensions) => [
        ...extensions,
        '.mjs',
        '.js',
      ]);
    }
  });
}
