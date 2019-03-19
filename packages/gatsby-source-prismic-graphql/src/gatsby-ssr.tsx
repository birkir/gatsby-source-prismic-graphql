import React from 'react';
import { PluginOptions } from './interfaces/PluginOptions';

interface OnRenderBodyArgs {
  setHeadComponents(args: React.ReactElement<any>[]): void;
}

exports.onRenderBody = ({ setHeadComponents }: OnRenderBodyArgs, pluginOptions: PluginOptions) => {
  let { repositoryName, accessToken, previews = false } = pluginOptions;

  // Remove accessToken if previews are disabled
  if (previews === false) {
    accessToken = null;
  }

  setHeadComponents([
    <script
      key={`plugin-source-prismic-graphql`}
      dangerouslySetInnerHTML={{
        __html: `window.___sourcePrismicGraphql = ${JSON.stringify({
          repositoryName,
          accessToken,
          previews,
        })}; `,
      }}
    />,
    <script
      key="prismic-config"
      dangerouslySetInnerHTML={{
        __html: `
            window.prismic = {
              endpoint: 'https://${repositoryName}.prismic.io/api/v2'
            };
          `,
      }}
    />,
    <script
      key="prismic-script"
      type="text/javascript"
      src="//static.cdn.prismic.io/prismic.min.js"
    />,
  ]);
};
