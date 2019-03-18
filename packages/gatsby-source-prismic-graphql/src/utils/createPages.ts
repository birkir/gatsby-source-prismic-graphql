import { createPage as prismicCreatePage } from './createPage';
import { Dictionary } from '../interfaces/Dictionary';
import { QueryStorage } from '../interfaces/QueryStorage';
import URL from './url';

function prismicGraphQL(graphql: any, queryStorage: QueryStorage, strQuery: string) {
  queryStorage['query'] = strQuery;
  return graphql(strQuery);
}

export function createPages(callback: (params: any) => void) {
  let dictionnary: Dictionary = {};
  let queryStorage: QueryStorage = {};

  return async ({ graphql, actions }: any) => {
    const { createPage } = actions;
    const customActions = Object.assign({}, actions, {
      createPrismicPage: prismicCreatePage.bind(null, createPage, queryStorage, dictionnary),
    });
    await callback({
      graphql: prismicGraphQL.bind(null, graphql, queryStorage),
      actions: customActions,
    });
    Object.entries(dictionnary).map(([urlPattern, { componentPath, previewQuery, customType }]) => {
      const fixURL = URL.extractFixURL(urlPattern);
      if (fixURL) {
        createPage({
          path: fixURL,
          matchPath: `${fixURL}/*`,
          component: componentPath,
          context: {
            _PRISMIC_PREVIEW_QUERY_FN_: previewQuery,
            _PRISMIC_URL_PATTERN_: urlPattern,
            _PRISMIC_CUSTOM_TYPE_: customType,
          },
        });
      }
    });
  };
}
