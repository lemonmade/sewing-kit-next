import {FirstArgument} from '@shopify/useful-types';
import {Ui} from './ui';

interface DiagnosticErrorOptions {
  message: string;
  suggestion?: FirstArgument<Ui['log']>;
}

export class DiagnosticError extends Error {
  readonly suggestion: DiagnosticErrorOptions['suggestion'];

  constructor({message, suggestion}: DiagnosticErrorOptions) {
    super(message);
    this.suggestion = suggestion;
  }
}

export class MissingPluginError extends DiagnosticError {
  constructor(plugin: string) {
    super({
      message: `Missing hooks provided by ${plugin}`,
      suggestion: (fmt) =>
        fmt`Run {command yarn add ${plugin}}, import it into your sewing-kit config file, and include it using the {code plugins} option.`,
    });
  }
}
