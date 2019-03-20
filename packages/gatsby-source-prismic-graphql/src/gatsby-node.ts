import path from 'path';
import {
  onCreateWebpackConfig,
  getRootQuery,
  sourceNodes,
} from 'gatsby-source-graphql-universal/gatsby-node';
import { fieldName, PrismicLink, typeName } from './utils';
import { PluginOptions } from './interfaces/PluginOptions';
import pathToRegexp from 'path-to-regexp';

exports.onCreateWebpackConfig = onCreateWebpackConfig;

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

exports.createPages = async ({ graphql, actions: { createPage } }: any, options: PluginOptions) => {
  const previewPath = options.previewPath || '/preview';

  createPage({
    path: previewPath.replace(/^\//, ''),
    component: path.resolve(path.join(__dirname, 'components', 'PreviewPage.js')),
    context: {
      prismicPreviewPage: true,
    },
  });

  await Promise.all(
    (options.pages || []).map(async page => {
      const queryKey = `all${page.type}s`;
      const query = `
      query {
        prismic {
          ${queryKey} {
            edges {
              node {
                _meta {
                  uid
                  lang
                  alternateLanguages {
                    uid
                    lang
                  }
                }
              }
            }
          }
        }
      }
    `;

      const { data } = await graphql(query);
      const toPath = pathToRegexp.compile(page.match);
      const rootQuery = getRootQuery(page.component);

      data.prismic[queryKey].edges.forEach(
        ({ node }: any) =>
          createPage({
            path: toPath(node._meta),
            component: page.component,
            context: {
              rootQuery,
              ...node._meta,
            },
          })
        // @todo create language pages
      );

      // used for preview placeholder page
      createPage({
        path: page.path,
        matchPath: process.env.NODE_ENV === 'production' ? undefined : page.match,
        component: page.component,
        context: {
          rootQuery,
          uid: '',
        },
      });
    })
  );
};
