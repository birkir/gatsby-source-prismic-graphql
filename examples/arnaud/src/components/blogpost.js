import React from 'react';
import { RichText } from 'prismic-reactjs';
import { graphql } from 'gatsby';
import { linkResolver } from '../prismic/linkResolver';

export const query = graphql`
  query BlogPost($uid: String) {
    prismic {
      allBlogposs(uid: $uid) {
        edges {
          node {
            _meta {
              uid
              lang
            }
            title
            body
          }
        }
      }
    }
  }
`;

const BlogPost = props => {
  const data = props.data.prismic.allBlogposs.edges[0].node;

  return (
    <div id="blogpost">
      <h1>{RichText.asText(data.title)}</h1>
      {RichText.render(data.body, linkResolver)}
    </div>
  );
};

export default BlogPost;
