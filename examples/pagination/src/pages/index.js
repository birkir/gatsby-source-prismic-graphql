import { graphql, Link } from 'gatsby';
import { get } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { getCursorFromDocumentIndex } from 'gatsby-source-prismic-graphql';
import Layout from '../components/layout';

export const query = graphql`
  query ArticleList($first: Int = 2, $last: Int, $after: String, $before: String) {
    prismic {
      allArticles(first: $first, last: $last, after: $after, before: $before) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
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

const Home = props => {
  const limit = 2;
  const didMountRef = useRef(false);
  const [page, setPage] = React.useState(-1);
  const [data, setData] = React.useState(props.data.prismic);

  if (!data) {
    return <div>no data</div>;
  }

  const onPreviousClick = () => setPage(page - limit);
  const onNextClick = () => setPage(page + limit);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    props.prismic
      .load({ variables: { after: getCursorFromDocumentIndex(page) } })
      .then(res => setData(res.data));
  }, [page]);

  return (
    <Layout>
      <h2>List of Articles</h2>
      <div style={{ borderStyle: 'solid', padding: '1em', marginBottom: '1em' }}>
        <h3>Dynamic Pagination</h3>
        <p>
          This example demonstrates dynamically-generated pagination. When the Next or Previous Page
          buttons are clicked, the page query is called again to fetch metadata about the next or
          previous pages. Notice here that pagination does not cause a URL route change.
        </p>
        <ul>
          {data.allArticles.edges.map(({ node }) => (
            <li key={node._meta.uid}>
              <Link to={`/article/${node._meta.uid}`}>{get(node, 'title.0.text', '---')}</Link>
            </li>
          ))}
        </ul>
        <button disabled={page <= 0} onClick={onPreviousClick}>
          prev page
        </button>
        <button disabled={!data.allArticles.pageInfo.hasNextPage} onClick={onNextClick}>
          next page
        </button>
      </div>
    </Layout>
  );
};

export default Home;
