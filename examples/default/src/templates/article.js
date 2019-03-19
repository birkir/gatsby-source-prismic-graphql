import React from 'react';
import { graphql } from 'gatsby';
import { get } from 'lodash';

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
          }
        }
      }
    }
  }
`;

const Article = props => {
  console.log('Article.props', props);
  const title = get(props.data, 'prismic.allArticles.edges.0.node.title.0.text');
  return (
    <article>
      <h1>{title}</h1>
      <p>article body</p>
    </article>
  );
};

export default Article;
