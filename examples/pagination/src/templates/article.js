import { graphql, Link } from 'gatsby';
import { linkResolver } from 'gatsby-source-prismic-graphql';
import { get } from 'lodash';
import { RichText } from 'prismic-reactjs';
import React from 'react';
import Layout from '../components/layout';

export const query = graphql`
  query ArticleQuery(
    $uid: String
    $paginationPreviousUid: String!
    $paginationPreviousLang: String!
    $paginationNextUid: String!
    $paginationNextLang: String!
  ) {
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
      prevArticle: article(uid: $paginationPreviousUid, lang: $paginationPreviousLang) {
        title
        _meta {
          uid
          lang
          type
        }
      }
      nextArticle: article(uid: $paginationNextUid, lang: $paginationNextLang) {
        title
        _meta {
          uid
          lang
          type
        }
      }
    }
  }
`;

const Pagination = ({ nextArticle, prevArticle }) => (
  <div style={{ borderStyle: 'solid', padding: '1em', marginBottom: '1em' }}>
    <h3>Simple Static Pagination</h3>
    <p>
      This example demonstrates staticly-generated pagination without additional page queries.
      Pagination information is retrieved directly from
      <code>pageContext</code>.
    </p>
    {prevArticle ? (
      <Link to={linkResolver(prevArticle)} aria-label="Previous Post">
        &larr;Previous
      </Link>
    ) : (
      ''
    )}
    {prevArticle && nextArticle && ' -- '}
    {nextArticle ? (
      <Link to={linkResolver(nextArticle)} aria-label="Next Post">
        Next &rarr;
      </Link>
    ) : (
      ''
    )}
  </div>
);

const EnhancedPagination = ({ nextArticle, prevArticle }) => (
  <div style={{ borderStyle: 'solid', padding: '1em', marginBottom: '1em' }}>
    <h3>Enhanced Static Pagination</h3>
    <p>
      This example demonstrates staticly-generated pagination enhanced with more detailed
      information about the previous and next documents&mdash;in this case, the article title.
      Modifying the page query is required.
    </p>
    {prevArticle ? (
      <Link to={linkResolver(prevArticle._meta)} aria-label="Previous Post">
        &larr; {RichText.asText(prevArticle.title || [], linkResolver)}
      </Link>
    ) : (
      ''
    )}
    <div>{prevArticle && nextArticle && ' -- '}</div>
    {nextArticle ? (
      <Link to={linkResolver(nextArticle._meta)} aria-label="Next Post">
        {RichText.asText(nextArticle.title || [], linkResolver)} &rarr;
      </Link>
    ) : (
      ''
    )}
  </div>
);

const Article = props => {
  const {
    pageContext: { paginationPreviousMeta, paginationNextMeta },
    data: {
      prismic: { prevArticle, nextArticle },
    },
  } = props;

  const title = get(props.data, 'prismic.allArticles.edges.0.node.title', []);
  const slices = get(props.data, 'prismic.allArticles.edges.0.node.body', []);

  const body = (slices || []).map((slice, index) => (
    <React.Fragment key={index}>
      {RichText.render(get(slice, 'primary.text', []) || [], linkResolver)}
    </React.Fragment>
  ));

  return (
    <Layout>
      <Pagination prevArticle={paginationPreviousMeta} nextArticle={paginationNextMeta} />
      <EnhancedPagination prevArticle={prevArticle} nextArticle={nextArticle} />
      {!!title && RichText.render(title, linkResolver)}
      {body}
      <Link to="/">Back to index</Link>
    </Layout>
  );
};

export default Article;
