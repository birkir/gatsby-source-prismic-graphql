import path from 'path';
import { sourceNodes, onCreateWebpackConfig } from 'gatsby-source-graphql-universal/gatsby-node';
import { PrismicLink, fieldName, typeName } from './utils';

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

exports.onCreateWebpackConfig = onCreateWebpackConfig;

exports.sourceNodes = (ref: any, options: { [key: string]: any; repositoryName: string }) => {
  options.fieldName = fieldName;
  options.typeName = typeName;
  options.createLink = () => PrismicLink({
    uri: `https://${options.repositoryName}.prismic.io/graphql`,
    credentials: 'same-origin',
  });

  return sourceNodes(ref, options);
};

exports.createPages = ({ actions }: CreatePage, options: PluginOptions) => {

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
