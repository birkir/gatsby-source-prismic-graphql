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

const getPagesQuery = ({ pageType }: { pageType: string }) => `
  query AllPagesQuery (
    $after: String
  ) {
    prismic {
      ${pageType} (
        first: 20
        after: $after
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          cursor
          node {
            _meta {
              id
              lang
              uid
              type
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

exports.createPages = async ({ graphql, actions: { createPage } }: any, options: PluginOptions) => {
  const previewPath = options.previewPath || '/preview';

  // Create top-level preview page
  createPage({
    path: previewPath.replace(/^\//, ''),
    component: path.resolve(path.join(__dirname, 'components', 'PreviewPage.js')),
    context: {
      prismicPreviewPage: true,
    },
  });

  let edgesCollection: [any?] = [];

  // Helper that recursively creates 20 pages at a time for the given page type
  // (Prismic GraphQL queries only return up to 20 results per query)
  async function createPageRecursively(page: any, endCursor: string = '') {
    const pageType = `all${page.type}s`;
    const query = getPagesQuery({ pageType });
    const { data, errors } = await graphql(query, { after: endCursor });
    const rootQuery = getRootQuery(page.component);

    if (errors && errors.length) {
      throw errors[0];
    }

    data.prismic[pageType].edges.forEach((edge: any) => (edge.endCursor = endCursor));

    // Add pages to list
    edgesCollection = [...edgesCollection, ...data.prismic[pageType].edges] as [any?];

    const hasNextPage = data.prismic[pageType].pageInfo.hasNextPage;
    const newEndCursor = data.prismic[pageType].pageInfo.endCursor;

    if (hasNextPage) {
      await createPageRecursively(page, newEndCursor);
    } else {
      // If there are no more pages, create the preview page for this page type
      // TODO: create pages from edges
      createPagesFromEdges(createPage, edgesCollection, rootQuery, options, page);
      edgesCollection = []; // empty out the array for the next page type
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
    }
  }

  // Create all the pages!
  const pages = options.pages || [];
  const pageCreators = pages.map(page => createPageRecursively(page));
  await Promise.all(pageCreators);
};

function createPagesFromEdges(
  createPage: (pageInfo: any) => void,
  edges: [any?],
  rootQuery: any,
  options: PluginOptions,
  page: any
) {
  // Cycle through each page returned from query...
  edges.forEach(({ cursor, node }: any, index: number) => {
    const params = {
      ...node._meta,
      lang: node._meta.lang === options.defaultLang ? null : node._meta.lang,
    };

    const toPath = pathToRegexp.compile(page.match || page.path);
    const path = toPath(params);

    // TODO: Include language in query...otherwise the pagination will get messed up
    if (page.lang && page.lang !== node._meta.lang) {
      return; // don't generate page in other than set language
    }

    // ...and create the page
    createPage({
      path: path === '' ? '/' : path,
      component: page.component,
      context: {
        rootQuery,
        ...node._meta,
        cursor,
        // would it be better to also include cursor or uid for prev and next pages?
        prevPageMeta: edges[index - 1] ? edges[index - 1].node._meta : null,
        nextPageMeta: edges[index + 1] ? edges[index + 1].node._meta : null,
        // lastPageEndCursor: index === 0 ? lastEndCursor : endCursor, // for paging back
        lastPageEndCursor: edges[index - 1] ? edges[index - 1].endCursor : '',
      },
    });
  });
}

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
