import React from 'react';
import { WrapPage } from './WrapPage';

export const withPreview = (render: Function, query: any, fragments: any = []) => {
  if (typeof window === 'undefined') {
    return render;
  }

  if (!render) {
    return null;
  }

  const RenderComponent = ({ data }: any) => render(data);
  const rootQuery = `${query.source}${fragments
    .map((fragment: any) => (fragment && fragment.source ? fragment.source : ''))
    .join(' ')}`;

  return (data: any) => (
    <WrapPage
      data={data}
      pageContext={{ rootQuery }}
      options={(window as any).prismicGatsbyOptions || {}}
    >
      <RenderComponent />
    </WrapPage>
  );
};
