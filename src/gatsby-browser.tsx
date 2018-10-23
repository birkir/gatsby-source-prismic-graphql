import React from 'react';
import PrismicPreviewWrapper from './PrismicPreviewWrapper';

interface WrapPageArgs {
  element: React.ReactNode;
  props: any;
}

interface PluginOptions {
  repositoryName?: string;
}

export const wrapPageElement = ({ element, props }: WrapPageArgs, options: PluginOptions) => {
  return (
    <PrismicPreviewWrapper
      {...props}
      repositoryName={options.repositoryName}
    >
      {element}
    </PrismicPreviewWrapper>
  )
}
