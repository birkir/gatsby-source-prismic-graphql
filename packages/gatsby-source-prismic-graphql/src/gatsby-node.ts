import path from 'path';
import { getRootQuery } from 'gatsby-source-graphql-universal/getRootQuery';
import { onCreateWebpackConfig, sourceNodes } from 'gatsby-source-graphql-universal/gatsby-node';
import { fieldName, PrismicLink, typeName } from './utils';
import { Page, PluginOptions } from './interfaces/PluginOptions';
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

function createGeneralPreviewPage(createPage: Function, options: PluginOptions): void {
  const previewPath = options.previewPath || '/preview';
  createPage({
    path: previewPath.replace(/^\//, ''),
    component: path.resolve(path.join(__dirname, 'components', 'PreviewPage.js')),
    context: {
      prismicPreviewPage: true,
    },
  });
}

function createDocumentPreviewPage(createPage: Function, page: Page, lang?: string): void {
  const rootQuery = getRootQuery(page.component);
  createPage({
    path: page.path,
    matchPath: process.env.NODE_ENV === 'production' ? undefined : page.match,
    component: page.component,
    context: { rootQuery, id: '', uid: '', lang },
  });
}

/**
 * Create URL paths interpolating `:uid` and `:lang` or `:lang?` with actual values.
 * @param pageOptions - Returned paths are based on the `match` or `path` (if `match`
 * is not present) properties of the `pageOptions` object.
 * @param node - Document node metadata provide the `lang` and `uid` values for the returned path.
 * @param defaultLang - `defaultLang` as declared in `PluginOptions`. If `lang` segment is
 * marked optional (`:lang?`) in the page `match` or `path` values and `defaultLang` matches the
 * document's actual language, the language segment of the path will be omitted in the returned path.
 * @return The path for the document's URL with `lang` and `uid` interpolated as necessary.
 */
function createDocumentPath(pageOptions: Page, node: any, defaultLang?: string): string {
  const pathKeys: any[] = [];
  const pathTemplate = pageOptions.match || pageOptions.path;
  pathToRegexp(pathTemplate, pathKeys);
  const langKey = pathKeys.find(key => key.name === 'lang');
  const isLangOptional = !!(langKey && langKey.optional);
  const toPath = pathToRegexp.compile(pathTemplate);

  const documentLang = node._meta.lang;
  const isDocumentLangDefault = documentLang === defaultLang;
  const shouldExcludeLangInPath = isLangOptional && isDocumentLangDefault;
  const lang = shouldExcludeLangInPath ? null : documentLang;

  const params = { ...node._meta, lang };
  const path = toPath(params);
  return path === '' ? '/' : path;
}

function createDocumentPages(
  createPage: Function,
  edges: [any?],
  options: PluginOptions,
  page: Page
): void {
  // Cycle through each document returned from query...
  edges.forEach(({ cursor, node }: any, index: number) => {
    // ...and create the page
    createPage({
      path: createDocumentPath(page, node, options.defaultLang),
      component: page.component,
      context: {
        rootQuery: getRootQuery(page.component),
        ...node._meta,
        cursor,
        prevPageMeta: edges[index - 1] ? edges[index - 1].node._meta : null,
        nextPageMeta: edges[index + 1] ? edges[index + 1].node._meta : null,
        lastPageEndCursor: edges[index - 1] ? edges[index - 1].endCursor : '',
      },
    });
  });
}

const getDocumentsQuery = ({ documentType }: { documentType: string }): string => `
  query AllPagesQuery ($after: String, $lang: String, $sortBy: PRISMIC_SortPosty) {
    prismic {
      ${documentType} (
        first: 20
        after: $after
        sortBy: $sortBy
        lang: $lang
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
  createGeneralPreviewPage(createPage, options);

  /**
   * Helper that recursively queries GraphQL to collect all documents for the given
   * page type. Once all documents are collected, it creates pages for them all.
   * Prismic GraphQL queries only return up to 20 results per query)
   */
  async function createPagesForType(
    page: Page,
    lang?: string,
    endCursor: string = '',
    documents: [any?] = []
  ): Promise<any> {
    const documentType = `all${page.type}s`;
    const query = getDocumentsQuery({ documentType });

    const { data, errors } = await graphql(query, {
      after: endCursor,
      lang: lang || null,
      sortBy: page.sortBy,
    });

    if (errors && errors.length) {
      throw errors[0];
    }

    const response = data.prismic[documentType];

    // Add last end cursor to all edges to enable pagination context when creating pages
    response.edges.forEach((edge: any) => (edge.endCursor = endCursor));

    // Stage documents for page creation
    documents = [...documents, ...response.edges] as [any?];

    if (response.pageInfo.hasNextPage) {
      const newEndCursor = response.pageInfo.endCursor;
      await createPagesForType(page, lang, newEndCursor, documents);
    } else {
      createDocumentPreviewPage(createPage, page, lang);
      createDocumentPages(createPage, documents, options, page);
    }
  }

  // Create all the pages!
  const pages = options.pages || [];

  // TODO: Decide whether options.defaultLang should be required. If not, what does it default to?
  // allQueries accept `null` as the lang. Post does not.
  const pageCreators: Promise<any>[] = [];
  pages.forEach(
    (page: Page): void => {
      const langs = page.langs || options.langs || (options.defaultLang && [options.defaultLang]);
      if (langs) {
        langs.forEach((lang: string) => pageCreators.push(createPagesForType(page, lang)));
      } else {
        pageCreators.push(createPagesForType(page));
      }
    }
  );

  await Promise.all(pageCreators);
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
