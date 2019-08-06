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
