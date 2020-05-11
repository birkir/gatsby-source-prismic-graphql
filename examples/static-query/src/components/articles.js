import React from 'react';
import { graphql, StaticQuery } from 'gatsby';
import { withPreview } from 'gatsby-source-prismic-graphql';
import { RichText } from 'prismic-reactjs';
import Img from 'gatsby-image';

const Image = ({ source = {}, property, ...props }) => {
  const sourceSharp = source[`${property}Sharp`];
  if (sourceSharp && sourceSharp.childImageSharp) {
    return <Img {...sourceSharp.childImageSharp} />;
  } else if (source[property] && source[property].url) {
    return <img src={source[property].url} {...props} />;
  }
  return null;
};

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
            image
            imageSharp {
              childImageSharp {
                fixed {
                  ...GatsbyImageSharpFixed
                }
              }
            }
          }
        }
      }
    }
  }
`;

const renderArticles = (data) => {
  return (
    <>
      <h1>List of articles</h1>
      <ul>
        {data.prismic.allArticles.edges.map(({ node }) => (
          <li key={node._meta.uid}>
            {RichText.render(node.title)}
            <Image source={node} property="image" />
          </li>
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
