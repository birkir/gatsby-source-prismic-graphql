import React from 'react';
import { RichText } from 'prismic-reactjs';
import { graphql } from 'gatsby';

export const query = graphql`
  query {
    prismic {
      allHomepages {
        edges {
          node {
            title
          }
        }
      }
    }
  }
`;

const Homepage = props => {
  const data = props.data.prismic.allHomepages.edges[0].node;

  return (
    <div id="homepage">
      <h1>{RichText.asText(data.title)}</h1>
    </div>
  );
};

export default Homepage;
