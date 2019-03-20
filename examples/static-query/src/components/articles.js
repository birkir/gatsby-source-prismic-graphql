import React from 'react';
import { graphql } from 'gatsby';
import { PreviewStaticQuery } from 'gatsby-source-prismic-graphql';
import { RichText } from 'prismic-reactjs';

const query = graphql`
  query {
    prismic {
      allArticles(first: 2) {
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

export const Articles = () => {
  return (
    <PreviewStaticQuery
      query={query}
      render={data => (
        <>
          <h1>List of articles</h1>
          <ul>
            {data.prismic.allArticles.edges.map(({ node }) => (
              <li key={node._meta.uid}>{RichText.render(node.title)}</li>
            ))}
          </ul>
        </>
      )}
    />
  );
};
