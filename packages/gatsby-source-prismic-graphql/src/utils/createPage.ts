import { Dictionary } from '../interfaces/Dictionary';
import { PageOptions } from '../interfaces/PageOptions';
import { QueryStorage } from '../interfaces/QueryStorage';
import Preview from './Preview';
import PrismicPage from './PrismicPage';
import URL from './url';

function validateOptions(options: any): PageOptions {
  const { pattern, context } = options;
  if (!pattern) throw Error('Create Page : Missing pattern parameter');
  const { data } = context;
  if (!data) throw Error(`Create Page : Missing data parameter in context for pattern ${pattern}`);

  return options as PageOptions;
}

export function createPage(
  gatsbyCreatePage: any,
  queryStorage: QueryStorage,
  dictionnary: Dictionary,
  opts: any
) {
  const options = validateOptions(opts);

  const { data } = options.context;
  if (!data) {
    throw Error(`Missing data for pattern ${options.pattern}`);
  }

  const meta = PrismicPage.buildMetadata(data);

  const previewQuery = Preview.buildQuery(meta, queryStorage);
  if (previewQuery) {
    const previewQueryGraphQL = Preview.convertToGraphQL(previewQuery, meta);

    const additionalContext = {
      _PRISMIC_PREVIEW_QUERY_: previewQueryGraphQL,
    };

    const customOptions = Object.assign({}, options, {
      path: URL.build(options.pattern, options.params),
      context: Object.assign({}, options.context, additionalContext),
    });
    delete customOptions.pattern;
    delete customOptions.params;
    delete customOptions.customType;

    dictionnary[options.pattern] = {
      componentPath: options.component,
      previewQuery,
      customType: options.customType,
    };
    gatsbyCreatePage(customOptions);
  } else {
    console.error(`Unable to generate preview for path ${options.pattern}`);
    const basicOptions = Object.assign({}, options, {
      path: URL.build(options.pattern, options.params),
      context: options.context,
    });
    gatsbyCreatePage(basicOptions);
  }
}
