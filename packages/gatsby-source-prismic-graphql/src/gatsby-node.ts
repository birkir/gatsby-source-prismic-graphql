import path from 'path';
import { sourceNodes } from 'gatsby-source-graphql/gatsby-node';
import { PrismicLink, fieldName, typeName } from './utils';

exports.sourceNodes = (
  ref: any,
  options: { [key: string]: any; accessToken?: string; repositoryName: string }
) => {
  options.fieldName = fieldName;
  options.typeName = typeName;
  options.createLink = () =>
    PrismicLink({
      uri: `https://${options.repositoryName}.prismic.io/graphql`,
      credentials: 'same-origin',
      accessToken: options.accessToken,
    });

  return sourceNodes(ref, options);
};

interface CreatePageInput {
  path: string;
  component: string;
  context: {
    [key: string]: any;
  };
}

interface CreatePage {
  actions: {
    createPage(input: CreatePageInput): void;
  };
}

interface PluginOptions {
  repositoryName: string;
  path?: null | string;
}

exports.createPages = ({ actions }: CreatePage, options: PluginOptions) => {
  const previewPath = options.path || '/preview';

  actions.createPage({
    path: previewPath.replace(/^\//, ''),
    component: path.resolve(path.join(__dirname, 'utils', 'PreviewPage.js')),
    context: {
      repositoryName: options.repositoryName,
    },
  });
};
