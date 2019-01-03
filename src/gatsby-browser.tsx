import React from 'react';
import { withPreview } from './withPreview';

interface WrapPageArgs {
  element: any; // React.ComponentType<any>;
  props: any;
}

interface PluginOptions {
  repositoryName?: string;
}

export const wrapPageElement = ({ element, props }: WrapPageArgs, options: PluginOptions) => {
  const Preview = withPreview(undefined, options);
  return <Preview {...props}>{element}</Preview>;
}
