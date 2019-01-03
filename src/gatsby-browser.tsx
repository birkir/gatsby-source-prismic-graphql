import React from 'react';
import { withPreview } from './withPreview';

interface WrapPageArgs {
  element: React.ComponentType<any>;
  props: any;
}

interface PluginOptions {
  repositoryName?: string;
}

export const wrapPageElement = ({ element, props }: WrapPageArgs, options: PluginOptions) => {
  return withPreview(element, { repositoryName: options.repositoryName });
}
