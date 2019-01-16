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
}

exports.onCreateWebpackConfig = onCreateWebpackConfig;

exports.sourceNodes = (ref: any, options: { [key: string]: any; accessToken?: string; repositoryName: string }) => {
  options.fieldName = fieldName;
  options.typeName = typeName;
  options.createLink = () => PrismicLink({
    uri: `https://${options.repositoryName}.prismic.io/graphql`,
    credentials: 'same-origin',
    accessToken: options.accessToken,
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
    }
  });
};
