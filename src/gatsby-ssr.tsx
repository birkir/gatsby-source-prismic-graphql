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
  let { repositoryName, accessToken, previews = true, linkResolver } = pluginOptions;

  if (previews === false) {
    accessToken = null;
  }

  setHeadComponents([
    <script
      key={`plugin-source-prismic-graphql`}
      dangerouslySetInnerHTML={{
        __html: `window.___sourcePrismicGraphql = ${JSON.stringify({ repositoryName, accessToken, previews, linkResolver: (linkResolver || '').toString(), })}; `
      }}
    />
  ]);
}
