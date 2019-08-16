interface WorkspaceCreateOptions {
  plugins: any[];
}

class WorkspaceCreator {
  constructor(private readonly options: WorkspaceCreateOptions) {}

  plugin(...plugins: any[]) {
    this.options.plugins.push(...plugins);
  }
}

export function createWorkspace(
  create: (pkg: WorkspaceCreator) => void | Promise<void>,
) {
  return async () => {
    const options = {plugins: []};
    const creator = new WorkspaceCreator(options);
    await create(creator);
    return options;
  };
}
