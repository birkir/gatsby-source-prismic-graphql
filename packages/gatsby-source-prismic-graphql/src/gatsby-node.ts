import fs from 'fs';
import path from 'path';
import { sourceNodes } from 'gatsby-source-graphql/gatsby-node';
import { babelParseToAst } from 'gatsby/dist/utils/babel-parse-to-ast';
import { get } from 'lodash';
import { fieldName, PrismicLink, typeName } from './utils';
import { PluginOptions } from './interfaces/PluginOptions';
import pathToRegexp from 'path-to-regexp';

const getRootQuery = (componentPath: string) => {
  const content = fs.readFileSync(componentPath, 'utf-8');
  const ast = babelParseToAst(content);
  const exported = get(ast, 'program.body', []).filter(
    (n: any) => n.type === 'ExportNamedDeclaration'
  );
  if (get(exported, '0.declaration.declarations.0.id.name') === 'query') {
    const query = get(exported, '0.declaration.declarations.0.init.quasi.quasis.0.value.raw');
    if (query) {
      return query;
    }
  }
  return null;
};

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

exports.onCreatePage = ({ page, actions }: any, plugins: any) => {
  const rootQuery = getRootQuery(page.componentPath);
  if (rootQuery) {
    page.context = page.context || {};
    page.context.rootQuery = rootQuery;
    actions.createPage(page);
  }
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
