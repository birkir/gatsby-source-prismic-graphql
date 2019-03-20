import React from 'react';
import { graphql, StaticQuery } from 'gatsby';
import { withPreview } from 'gatsby-source-prismic-graphql';
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

const renderArticles = data => {
  return (
    <>
      <h1>List of articles</h1>
      <ul>
        {data.prismic.allArticles.edges.map(({ node }) => (
          <li key={node._meta.uid}>{RichText.render(node.title)}</li>
        ))}
      </ul>
    </>
  );
};

export const Articles = () => {
  return (
    <>
      <StaticQuery query={query} render={withPreview(renderArticles, query)} />
    </>
  );
};
