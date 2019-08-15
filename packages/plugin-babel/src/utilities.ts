import {BabelConfig} from './types';

const PRESET_MATCHER = /(babel-preset-shopify(?:\/[^.]*)?)/;

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
