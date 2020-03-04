import React from 'react';
import { PluginOptions } from './interfaces/PluginOptions';

interface OnRenderBodyArgs {
  setHeadComponents(args: React.ReactElement<any>[]): void;
}

exports.onRenderBody = ({ setHeadComponents }: OnRenderBodyArgs, options: PluginOptions) => {
  const components = [
    <script
      key="prismic-config"
      dangerouslySetInnerHTML={{
        __html: `
            window.prismic = {
              endpoint: 'https://${options.repositoryName}.prismic.io/api/v2',
            };
            window.prismicGatsbyOptions = ${JSON.stringify(options)};
          `,
      }}
    />,
  ];

  if (options.omitPrismicScript !== true) {
    components.push(
      <script
        key="prismic-script"
        type="text/javascript"
        src="//static.cdn.prismic.io/prismic.min.js"
      />
    );
  }

  setHeadComponents(components);
};
