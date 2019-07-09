import path from 'path';
import { getRootQuery } from 'gatsby-source-graphql-universal/getRootQuery';
import { onCreateWebpackConfig, sourceNodes } from 'gatsby-source-graphql-universal/gatsby-node';
import { fieldName, PrismicLink, typeName } from './utils';
import { PluginOptions } from './interfaces/PluginOptions';
import { createRemoteFileNode } from 'gatsby-source-filesystem';
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

exports.sourceNodes = (ref: any, options: PluginOptions) => {
  const opts = {
    fieldName,
    typeName,
    createLink: () =>
      PrismicLink({
        uri: `https://${options.repositoryName}.prismic.io/graphql`,
        credentials: 'same-origin',
        accessToken: options.accessToken as any,
        customRef: options.prismicRef as any,
      }),
    ...options,
  };

  return sourceNodes(ref, opts);
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

exports.createResolvers = (
  { actions, cache, createNodeId, createResolvers, store, reporter }: any,
  { sharpKeys = [/image|photo|picture/] }: PluginOptions
) => {
  const { createNode } = actions;

  const state = store.getState();
  const [prismicSchema = {}] = state.schemaCustomization.thirdPartySchemas;
  const typeMap = prismicSchema._typeMap;
  const resolvers: { [key: string]: any } = {};

  for (const typeName in typeMap) {
    const typeEntry = typeMap[typeName];
    const typeFields = (typeEntry && typeEntry.getFields && typeEntry.getFields()) || {};
    const typeResolver: { [key: string]: any } = {};
    for (const fieldName in typeFields) {
      const field = typeFields[fieldName];
      if (
        field.type === typeMap.PRISMIC_Json &&
        sharpKeys.some((re: RegExp | string) =>
          re instanceof RegExp ? re.test(fieldName) : re === fieldName
        )
      ) {
        typeResolver[`${fieldName}Sharp`] = {
          type: 'File',
          args: {
            crop: { type: typeMap.String },
          },
          resolve(source: any, args: any) {
            const obj = (source && source[fieldName]) || {};
            const url = args.crop ? obj[args.crop] && obj[args.crop].url : obj.url;
            if (url) {
              return createRemoteFileNode({
                url,
                store,
                cache,
                createNode,
                createNodeId,
                reporter,
              });
            }
            return null;
          },
        };
      }
    }
    if (Object.keys(typeResolver).length) {
      resolvers[typeName] = typeResolver;
    }
  }

  if (Object.keys(resolvers).length) {
    createResolvers(resolvers);
  }
};
