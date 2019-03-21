import { graphql, Link } from 'gatsby';
import { linkResolver } from 'gatsby-source-prismic-graphql';
import { RichText } from 'prismic-reactjs';
import React from 'react';
import Layout from '../components/layout';

export const query = graphql`
  query ArticleQuery($uid: String) {
    prismic {
      allArticles(uid: $uid) {
        edges {
          node {
            _meta {
              uid
            }
          }
        }
      }
    }
  }
`;

export default function Article(props) {
  return (
    <Layout>
      <h1>Article</h1>
      <Link to="/">Back to index</Link>
    </Layout>
  );
}
