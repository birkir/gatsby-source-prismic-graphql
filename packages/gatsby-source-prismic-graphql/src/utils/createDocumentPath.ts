import pathToRegexp, { Key } from 'path-to-regexp';
import { Page } from '../interfaces/PluginOptions';

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
export function createDocumentPath(pageOptions: Page, node: any, defaultLang?: string): string {
  const { keys, toPath }: { keys: Key[]; toPath: Function } = (() => {
    const pathKeys: Key[] = [];
    const pathTemplate: string = pageOptions.match || pageOptions.path;
    // populate pathKeys
    pathToRegexp(pathTemplate, pathKeys);

    return {
      keys: pathKeys,
      toPath: pathToRegexp.compile(pathTemplate),
    };
  })();

  const lang: string | null = (() => {
    const key = keys.find(key => key.name === 'lang');
    const isOptional: boolean = Boolean(key && key.optional);
    const isDefault: boolean = node._meta.lang === defaultLang;
    if (isOptional && isDefault) return null;
    return node._meta.lang;
  })();

  const customParams = (() => {
    const customKeys = keys.filter(k => k.name !== 'uid' && k.name !== 'lang');
    if (customKeys.length === 0) return {};

    const queryBuilder = pageOptions.queryParams || ({} as any);

    const errorMessage = (param: string, strackTrace: string = '') => `
    [Prismic Plugin]
      Error in your gatsby routing configuration for type [${pageOptions.type}].
      ${strackTrace}
    `;

    return customKeys.reduce((acc: { [key: string]: string }, key: Key) => {
      const paramBuilder = queryBuilder[key.name];
      const builtParam = (() => {
        if (paramBuilder) {
          try {
            return paramBuilder(node);
          } catch (e) {
            if (key.optional) return acc;
            throw new Error(
              errorMessage(key.name.toString(), `Invalid resolver for [${key.name}]: ${e.message}`)
            );
          }
        }
      })();
      if (builtParam) return Object.assign({}, acc, { [key.name]: builtParam });
      else if (key.optional) return acc;
      else
        throw new Error(
          errorMessage(
            key.name.toString(),
            `Missing resolver for the query param [${key.name}] in your gatsby config.`
          )
        );
    }, {});
  })();

  const params = { ...node._meta, lang, ...customParams };
  const path: string = toPath(params);
  return path === '' ? '/' : path;
}
