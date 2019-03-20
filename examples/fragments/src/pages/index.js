import { graphql } from 'gatsby';
import React from 'react';
import { Articles } from '../components/articles';
import Layout from '../components/layout';
import { ArticleFragment } from '../fragments/ArticleFragment';

export const query = graphql`
  query {
    prismic {
      allArticles(first: 3) {
        edges {
          node {
            ...ArticleFragment
          }
        }
      }
    }
  }
`;

export default function Home(props) {
  return (
    <Layout>
      <div>
        <h3>Articles count: {props.data.prismic.allArticles.edges.length}</h3>
        <Articles />
      </div>
    </Layout>
  );
}

Home.fragments = [ArticleFragment];
