import React from 'react';
import { WrapPage } from './WrapPage';

export const withPreview = (render: Function, query: any) => {
  if (typeof window === 'undefined') {
    return render;
  }

  if (!render) {
    return null;
  }

  const RenderComponent = ({ data }: any) => render(data);

  return (data: any) => (
    <WrapPage
      data={data}
      pageContext={{
        rootQuery: (query && query.source) || query,
      }}
      options={(window as any).prismicGatsbyOptions || {}}
    >
      <RenderComponent />
    </WrapPage>
  );
};
