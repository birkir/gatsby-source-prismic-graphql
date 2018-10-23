import path from 'path';

interface CreatePageInput {
  path: string;
  component: string;
  context: {
    [key: string]: any;
  }
}

interface CreatePage {
  actions: {
    createPage(input: CreatePageInput): void;
  }
}

interface PluginOptions {
  repositoryName: string;
  path?: string;
  linkResolver(doc: any): void;
}

export const createPages = ({ actions }: CreatePage, options: PluginOptions) => {

  const previewPath = (options.path || '/preview');

  actions.createPage({
    path: previewPath.replace(/^\//, ''),
    component: path.resolve(path.join(__dirname, 'Preview.js')),
    context: {
      ...options,
      linkResolver: options.linkResolver.toString(),
    }
  });
};
