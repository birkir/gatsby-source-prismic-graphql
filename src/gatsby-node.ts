import { sourceNodes, onCreateWebpackConfig } from 'gatsby-source-graphql-universal/gatsby-node';
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
  path?: null | string;
  linkResolver(doc: any): void;
}

exports.sourceNodes = sourceNodes;

exports.onCreateWebpackConfig = onCreateWebpackConfig;

exports.createPages = ({ actions }: CreatePage, options: PluginOptions) => {

  if (options.path === null) {
    return;
  }

  const previewPath = (options.path || '/preview');

  actions.createPage({
    path: previewPath.replace(/^\//, ''),
    component: path.resolve(path.join(__dirname, 'PreviewPage.js')),
    context: {
      repositoryName: options.repositoryName,
      linkResolver: (options.linkResolver || '').toString(),
    }
  });
};
