import React from 'react';
import fs from 'fs';
import path from 'path';

interface OnRenderBodyArgs {
  setHeadComponents(args: React.ReactElement<any>[]): void;
}

interface IPluginOptions {
  repositoryName: string;
  accessToken?: null | string;
  previews?: boolean;
  linkResolver?: Function;
  linkOptions?: {
    useGETForQueries?: boolean;
    headers?: {
      [key: string]: string | number;
    };
    fetchOptions?: {
      [key: string]: string | number;
    };
    credentials?: 'omit' | 'include' | 'same-origin';
    includeExtensions?: boolean;
  }
}

exports.onRenderBody = ({ setHeadComponents }: OnRenderBodyArgs, pluginOptions: IPluginOptions) => {
  let { repositoryName, accessToken, previews = false, linkOptions } = pluginOptions;

  if (previews === false) {
    // Remove accessToken if previews are disabled
    accessToken = null;
  }

  let fragmentMatcher;
  try {
    const fragmentData = fs.readFileSync(path.join(process.cwd(), '.cache', 'prismic.fragments.json'), 'utf8');
    fragmentMatcher = JSON.parse(fragmentData);
  } catch (err) {
    console.log('Failed to fetch fragment matches', err);
  }

  setHeadComponents([
    <script
      key={`plugin-source-prismic-graphql`}
      dangerouslySetInnerHTML={{
        __html: `window.___sourcePrismicGraphql = ${JSON.stringify({ repositoryName, accessToken, previews, linkOptions, fragmentMatcher })}; `
      }}
    />
  ]);

  setHeadComponents([
    <script
      key="prismic-config"
      dangerouslySetInnerHTML={{
        __html: `
          window.prismic = {
            endpoint: 'https://${repositoryName}.prismic.io/api/v2'
          };
        `
      }}
    />,
    <script key="prismic-script" type="text/javascript" src="//static.cdn.prismic.io/prismic.min.js" />
  ]);

}
