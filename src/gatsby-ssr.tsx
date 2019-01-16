import React from 'react';

interface OnRenderBodyArgs {
  setHeadComponents(args: React.ReactElement<any>[]): void;
}

interface IPluginOptions {
  repositoryName: string;
  accessToken?: null | string;
  previews?: boolean;
  linkResolver?: Function;
}

exports.onRenderBody = ({ setHeadComponents }: OnRenderBodyArgs, pluginOptions: IPluginOptions) => {
  let { repositoryName, accessToken, previews = false } = pluginOptions;

  if (previews === false) {
    // Remove accessToken if previews are disabled
    accessToken = null;
  }

  setHeadComponents([
    <script
      key={`plugin-source-prismic-graphql`}
      dangerouslySetInnerHTML={{
        __html: `window.___sourcePrismicGraphql = ${JSON.stringify({ repositoryName, accessToken, previews })}; `
      }}
    />
  ]);

  if (previews) {
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

}
