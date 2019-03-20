import { graphql, Link } from 'gatsby';
import { linkResolver } from 'gatsby-source-prismic-graphql';
import { get } from 'lodash';
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
            title
            body {
              ... on PRISMIC_ArticleBodyText {
                primary {
                  text
                }
              }
            }
          }
        }
      }
    }
  }
`;

const Article = props => {
  const title = get(props.data, 'prismic.allArticles.edges.0.node.title', []);
  const slices = get(props.data, 'prismic.allArticles.edges.0.node.body', []);
  const body = (slices || []).map((slice, index) => (
    <React.Fragment key={index}>
      {RichText.render(get(slice, 'primary.text', []) || [], linkResolver)}
    </React.Fragment>
  ));

  return (
    <Layout>
      {!!title && RichText.render(title, linkResolver)}
      {body}
      <Link to="/">Back to index</Link>
    </Layout>
  );
};

export default Article;
