# `sewing-kit-next`

## Get started

Just run `yarn` and you should be good to go. If you ever have issues with modules being unable to resolve references to other packages in the monorepo, run `yarn bootstrap` (you may also need to run the `TypeScript: Restart TS server` action in VSCode).

## TODO

- [ ] Make `ui.log` work in the context of a step (should nest the logs under the step)
- [ ] Let steps be aware of their current status (in progress/ pending/ error/ success)
- [ ] Let you skip some pre steps (need an ID on steps and then something like `--skip-pre clean`)
- [ ] Make sure type check works for tests (e.g., test files are type checked)
- [ ] Split the discovery part of the `plugin-{web-app,service,package}-base` from the other details, because discovery is opinionated and the other parts aren't so much (or, they are distinct opinions). All of the discovery can probably go in a single package.
- [ ] Make a generic `--focus` flag across a bunch of commands that lets you pick only a subset of projects to run on
- [ ] Make `loadConfig` accept an expected config type, fail if providing a service config when expecting a web app (for example)
- [ ] Maybe allow passing project-level plugins at root, and then they are applied to each project? It is a bit weird right now that all plugins will probably need a "all projects" and a "single project" mode
- [ ] Make sure that running `Workspace#run()` (in test) returns the output that the user would have actually seen
- [ ] Move the definition of workspace/ web app/ service etc to its own package. Same thing with steps, and with plugins. Because of the hoops to get module type augmentation working and the interdependencies between various packages, the current setup means that only a subset of the hooks API for sewing-kit can be expressed in `@sewing-kit/types`, since anything that depends on knowledge of `Workspace` (which is a concept defined in `@sewing-kit/core`, which depends on `@sewing-kit/types`) can only be written in `@sewing-kit/core`. The problem for plugins and steps is similar, but just generally speaking, those things are all discrete concepts that would be better as their own things.

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
