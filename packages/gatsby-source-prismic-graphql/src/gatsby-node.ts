import path from 'path';
import { getRootQuery } from 'gatsby-source-graphql-universal/getRootQuery';
import { onCreateWebpackConfig, sourceNodes } from 'gatsby-source-graphql-universal/gatsby-node';
import { fieldName, PrismicLink, typeName } from './utils';
import { Page, PluginOptions } from './interfaces/PluginOptions';
import { createRemoteFileNode } from 'gatsby-source-filesystem';
import pathToRegexp from 'path-to-regexp';
import querystring from 'querystring';

exports.onCreateWebpackConfig = onCreateWebpackConfig;

let accessToken: string | null | undefined;
exports.onPreInit = (_: any, options: PluginOptions) => {
  accessToken = options.accessToken;
  if (!options.previews) {
    delete options.accessToken;
  }
};

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
        accessToken: accessToken as any,
        customRef: options.prismicRef as any,
      }),
    ...options,
  };

  return sourceNodes(ref, opts);
};

function createGeneralPreviewPage(createPage: Function, options: PluginOptions): void {
  const previewPath: string = options.previewPath || '/preview';
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
    context: {
      rootQuery,
      id: '',
      uid: '',
      lang,
      paginationPreviousUid: '',
      paginationPreviousLang: '',
      paginationNextUid: '',
      paginationNextLang: '',
    },
  });
}

/**
 * Create URL paths interpolating `:uid` and `:lang` or `:lang?` with actual values.
 * @param pageOptions - Returned paths are based on the `match` or `path` (if `match`
 * is not present) properties of the `pageOptions` object.
 * @param node - Document node metadata provide the `lang` and `uid` values for the returned path.
 * @param options - The plugin's global options.
 * @param options.defaultLang - `defaultLang` as declared in `PluginOptions`. If `lang` segment is
 * marked optional (`:lang?`) in the page `match` or `path` values and `defaultLang` matches the
 * document's actual language, the language segment of the path will be omitted in the returned path.
 * @param options.shortenUrlLangs - When truthy, the lang used for the path will be limited to 2 characters.
 * @return The path for the document's URL with `lang` and `uid` interpolated as necessary.
 */
function createDocumentPath(
  pageOptions: Page,
  node: any,
  { defaultLang, shortenUrlLangs }: PluginOptions
): string {
  const pathKeys: any[] = [];
  const pathTemplate: string = pageOptions.match || pageOptions.path;
  pathToRegexp(pathTemplate, pathKeys);
  const langKey = pathKeys.find(key => key.name === 'lang');
  const isLangOptional: boolean = !!(langKey && langKey.optional);
  const toPath: Function = pathToRegexp.compile(pathTemplate);

  const documentLang: string = node._meta.lang;
  const isDocumentLangDefault: boolean = documentLang === defaultLang;
  const shouldExcludeLangInPath: boolean = isLangOptional && isDocumentLangDefault;
  const displayedLang: string = shortenUrlLangs ? documentLang.slice(0, 2) : documentLang;
  const lang: string | null = shouldExcludeLangInPath ? null : displayedLang;

  const params = { ...node._meta, lang };
  const path: string = decodeURI(toPath(params));
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
    const previousNode = edges[index - 1] && edges[index - 1].node;
    const nextNode = edges[index + 1] && edges[index + 1].node;

    // ...and create the page
    createPage({
      path: createDocumentPath(page, node, options),
      component: page.component,
      context: {
        rootQuery: getRootQuery(page.component),
        ...node._meta,
        cursor,
        paginationPreviousMeta: previousNode ? previousNode._meta : null,
        paginationPreviousUid: previousNode ? previousNode._meta.uid : '',
        paginationPreviousLang: previousNode ? previousNode._meta.lang : '',
        paginationNextMeta: nextNode ? nextNode._meta : null,
        paginationNextUid: nextNode ? nextNode._meta.uid : '',
        paginationNextLang: nextNode ? nextNode._meta.lang : '',
        // pagination helpers for overcoming backwards pagination issues cause by Prismic's 20-document query limit
        lastQueryChunkEndCursor: edges[index - 1] ? edges[index - 1].endCursor : '',
      },
    });
  });
}

const getDocumentsQuery = ({
  documentType,
  sortType,
  extraPageFields,
}: {
  documentType: string;
  sortType: string;
  extraPageFields: string;
}): string => `
  query AllPagesQuery ($after: String, $lang: String, $sortBy: ${sortType}) {
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
            ${extraPageFields}
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
    // Prepare and execute query
    const documentType: string = `all${page.type}s`;
    const sortType: string = `PRISMIC_Sort${page.type}y`;
    const extraPageFields = options.extraPageFields || '';
    const query: string = getDocumentsQuery({ documentType, sortType, extraPageFields });
    const { data, errors } = await graphql(query, {
      after: endCursor,
      lang: lang || null,
      sortBy: page.sortBy,
    });

    if (errors && errors.length) {
      throw errors[0];
    }

    const response = data.prismic[documentType];
    const edges = page.filter ? response.edges.filter(page.filter) : response.edges;

    // Add last end cursor to all edges to enable pagination context when creating pages
    edges.forEach((edge: any) => (edge.endCursor = endCursor));

    // Stage documents for page creation
    documents = [...documents, ...edges] as [any?];

    if (response.pageInfo.hasNextPage) {
      const newEndCursor: string = response.pageInfo.endCursor;
      await createPagesForType(page, lang, newEndCursor, documents);
    } else {
      createDocumentPreviewPage(createPage, page, lang);
      createDocumentPages(createPage, documents, options, page);
    }
  }

  // Prepare to create all the pages
  const pages: Page[] = options.pages || [];
  const pageCreators: Promise<any>[] = [];

  // Create pageCreator promises for each page/language combination
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

  // Run all pageCreators simultaneously
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
                url: querystring.unescape(url),
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
