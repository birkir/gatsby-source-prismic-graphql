import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { sourceNodes } from 'gatsby-source-graphql-universal/gatsby-node';
import { fieldName, PrismicLink, typeName } from './utils';

interface CreatePageInput {
  path: string;
  component: string;
  context: {
    [key: string]: any;
  }
}

interface CreatePage {
  actions: {
    createPage(input: CreatePageInput): void;
  }
}

interface PluginOptions {
  repositoryName: string;
  path?: null | string;
}

exports.sourceNodes = (ref: any, options: { [key: string]: any; accessToken?: string; repositoryName: string, linkOptions?: any }) => {
  options.fieldName = fieldName;
  options.typeName = typeName;

  const uri = `https://${options.repositoryName}.prismic.io/graphql`;

  options.createLink = () => PrismicLink({
    uri,
    credentials: 'same-origin',
    accessToken: options.accessToken,
    ...options.linkOptions,
    useGETForQueries: true,
  });

  fetch(`https://${options.repositoryName}.prismic.io/api`)
  .then((r: any) => r.json())
  .then((data: any) => {
    const ref = data.refs.find((r: any) => r.id === 'master');
    if (!ref) return;
    fetch(`${uri}?query=%7B%20__schema%20%7B%20types%20%7B%20kind%20name%20possibleTypes%20%7B%20name%20%7D%20%7D%20%7D%20%7D`, {
      headers: {
        'prismic-ref': ref.ref,
      }
    })
    .then((result: any) => result.json())
    .then((result: any) => {
      try {
        const filteredData = result.data.__schema.types.filter(
          (type: any) => type.possibleTypes !== null,
        );

        result.data.__schema.types = filteredData;

        const targetFile = path.join(process.cwd(), '.cache', 'prismic.fragments.json');

        fs.writeFile(targetFile, JSON.stringify(result.data), err => {
          if (err) {
            console.error('Error writing fragmentTypes file', err);
          } else {
            console.log('Fragment types successfully extracted!');
          }
        });
      } catch (err) {
        console.log('Could not fetch fragments', err);
      }
    });
  });

  return sourceNodes(ref, options);
};

exports.createPages = ({ actions }: CreatePage, options: PluginOptions) => {

  const previewPath = (options.path || '/preview');

  actions.createPage({
    path: previewPath.replace(/^\//, ''),
    component: path.resolve(path.join(__dirname, 'PreviewPage.js')),
    context: {
      repositoryName: options.repositoryName,
    }
  });
};
