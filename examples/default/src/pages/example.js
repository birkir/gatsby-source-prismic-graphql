import { graphql, Link } from 'gatsby';
import React from 'react';

export const query = graphql`
  query {
    prismic {
      allArticles {
        edges {
          node {
            _meta {
              uid
            }
            title
          }
        }
      }
    }
  }
`;

const Example = ({ data, ...props }) => {
  console.log(data, props);

  return (
    <p>
      ELLO <Link to="/article/the-wordpress-question">yes</Link>
    </p>
  );
};

export default Example;
