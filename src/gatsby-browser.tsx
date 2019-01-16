import React from 'react';
import { StaticQuery } from 'gatsby';
import PropTypes from 'prop-types';
import { withPreview } from './withPreview';

// Fixes proptypes warning for StaticQuery
(StaticQuery as any).propTypes.query = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    id: PropTypes.string,
    source: PropTypes.string,
  }),
]);

interface WrapPageArgs {
  element: any;
  props: any;
}

export const wrapPageElement = ({ element, props }: WrapPageArgs, { previews = false }: any) => {
  const { query } = element.props.pageResources.component || { query: null };
  if (query && previews) {
    const Preview = withPreview(undefined, query);
    return <Preview {...props}>{element}</Preview>;
  }
  return element;
}
