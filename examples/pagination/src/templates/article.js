import React from 'react';
import { graphql, Link } from 'gatsby';
import { get } from 'lodash';
import { RichText } from 'prismic-reactjs';
import { linkResolver } from 'gatsby-source-prismic-graphql';

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
    <article>
      {!!title && RichText.render(title, linkResolver)}
      {body}
      <Link to="/">Back to index</Link>
    </article>
  );
};

export default Article;
