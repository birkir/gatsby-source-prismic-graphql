import React from 'react';
import { RichText } from 'prismic-reactjs';
import { graphql } from 'gatsby';

export const query = graphql`
  query {
    prsmc {
      allHomepages {
        edges {
          node {
            title
          }
        }
      }
      __typename
    }
  }
`;

const Homepage = props => {
  const data = props.data.prsmc.allHomepages.edges[0].node;

  return (
    <div id="homepage">
      <h1>{RichText.asText(data.title)}</h1>
      <h2>The typename is "{props.data.prsmc.__typename}"</h2>
    </div>
  );
};

export default Homepage;
