import React from 'react';
import { StaticQuery, StaticQueryProps, graphql } from 'gatsby';
import { WrapPage } from './WrapPage';

export const PreviewStaticQuery = ({ query, render }: StaticQueryProps) => {
  if (typeof window === 'undefined') {
    return <StaticQuery query={query} render={render} />;
  }

  return (
    <StaticQuery
      query={query}
      render={data => {
        const pageContext = {
          rootQuery: query && query.source,
        };
        const options = (window as any).prismicGatsbyOptions || {};
        if (!render) {
          return null;
        }
        const RenderComponent: any = ({ data }: any) => render(data);
        return (
          <WrapPage data={data} pageContext={pageContext} options={options}>
            <RenderComponent />
          </WrapPage>
        );
      }}
    />
  );
};
