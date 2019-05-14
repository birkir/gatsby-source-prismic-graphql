import path from 'path';
import { getRootQuery } from 'gatsby-source-graphql-universal/getRootQuery';
import { onCreateWebpackConfig, sourceNodes } from 'gatsby-source-graphql-universal/gatsby-node';
import { fieldName, PrismicLink, typeName } from './utils';
import { PluginOptions } from './interfaces/PluginOptions';
import pathToRegexp from 'path-to-regexp';

exports.onCreateWebpackConfig = onCreateWebpackConfig;

exports.onCreatePage = ({ page, actions }: any) => {
  const rootQuery = getRootQuery(page.componentPath);
  page.context = page.context || {};
  if (rootQuery) {
    page.context.rootQuery = rootQuery;
    actions.createPage(page);
  }
};

exports.sourceNodes = (
  ref: any,
  options: { [key: string]: any; accessToken?: string; customRef?: string; repositoryName: string }
) => {
  options.fieldName = fieldName;
  options.typeName = typeName;
  options.createLink = () =>
    PrismicLink({
      uri: `https://${options.repositoryName}.prismic.io/graphql`,
      credentials: 'same-origin',
      accessToken: options.accessToken,
      customRef: options.prismicRef,
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
                  id
                  lang
                  uid
                  alternateLanguages {
                    id
                    lang
                    type
                    uid
                  }
                }
              }
            }
          }
        }
      }
    `;

      const { data, errors } = await graphql(query);
      const toPath = pathToRegexp.compile(page.match || page.path);
      const rootQuery = getRootQuery(page.component);

      if (errors && errors.length) {
        throw errors[0];
      }

      data.prismic[queryKey].edges.forEach(({ node }: any) => {
        const params = {
          ...node._meta,
          lang: node._meta.lang === options.defaultLang ? null : node._meta.lang,
        };
        const path = toPath(params);

        if (page.lang && page.lang !== node._meta.lang) {
          // don't generate page in other than set language.
          return;
        }

        createPage({
          path: path === '' ? '/' : path,
          component: page.component,
          context: {
            rootQuery,
            ...node._meta,
          },
        });
      });

      // used for preview placeholder page
      createPage({
        path: page.path,
        matchPath: process.env.NODE_ENV === 'production' ? undefined : page.match,
        component: page.component,
        context: {
          rootQuery,
          id: '',
          uid: '',
          lang: options.defaultLang,
        },
      });
    })
  );
};
