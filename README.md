# `sewing-kit-next`

## Get started

Just run `yarn` and you should be good to go. If you ever have issues with modules being unable to resolve references to other packages in the monorepo, run `yarn bootstrap` (you may also need to run the `TypeScript: Restart TS server` action in VSCode).

## TODO

- [ ] Make `ui.log` work in the context of a step (should nest the logs under the step)
- [ ] Let steps be aware of their current status (in progress/ pending/ error/ success)
- [ ] Let you skip some pre steps (need an ID on steps and then something like `--skip-pre clean`)
- [ ] Make sure type check works for tests

## Errors to handle

### Forgot to `export default` from a config

Results in an empty object coming from `loadConfig`, which causes this error:

```
The following unexpected error occurred. Please raise an issue on [the sewing-kit repo](https://github.com/Shopify/sewing-kit).
defaultOrCommonJsExport(...) is not a function
TypeError: defaultOrCommonJsExport(...) is not a function
    at loadConfig (/Users/lemon/Projects/sewing-kit-next/packages/config/build/cjs/load.js:48:12)
```

### Accidentally passing in a non-function for a plugin

```
The following unexpected error occurred. Please raise an issue on [the sewing-kit repo](https://github.com/Shopify/sewing-kit).
plugin is not a function
TypeError: plugin is not a function
    at plugin (/Users/lemon/Projects/sewing-kit-next/packages/core/build/cjs/tasks/discovery/discovery.js:153:19)
    at tryCatch (/Users/lemon/Projects/sewing-kit-next/node_modules/regenerator-runtime/runtime.js:45:40)
    at Generator.invoke [as _invoke] (/Users/lemon/Projects/sewing-kit-next/node_modules/regenerator-runtime/runtime.js:271:22)
    at Generator.prototype.(anonymous function) [as next] (/Users/lemon/Projects/sewing-kit-next/node_modules/regenerator-runtime/runtime.js:97:21)
    at asyncGeneratorStep (/Users/lemon/Projects/sewing-kit-next/packages/core/build/cjs/tasks/discovery/discovery.js:59:16)
    at asyncGeneratorStep (/Users/lemon/Projects/sewing-kit-next/packages/core/build/cjs/tasks/discovery/discovery.js:79:9)
```

## Styleguide

- Hooks that are tightly coupled to a tool should be prefixed with the name (e.g., `webpackRules`, `jestConfig`). Hooks that are for a more general concept can omit the prefix, which makes it easier to be consistent across different tasks (e.g., `extensions`).
- Dash case for CLI flags
