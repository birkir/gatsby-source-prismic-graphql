import { graphql } from 'gatsby';

export const ArticleFragment = graphql`
  fragment ArticleFragment on PRISMIC_Article {
    _meta {
      uid
    }
    title
  }
`;
