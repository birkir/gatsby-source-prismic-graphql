import { graphql, Link } from 'gatsby';
import { get } from 'lodash';
import React, { useEffect } from 'react';
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
  const [page, setPage] = React.useState(-1);
  const [data, setData] = React.useState(props.data.prismic);

  if (!data) {
    return <div>no data</div>;
  }

  const onPreviousClick = () => setPage(Math.max(0, page) - limit);
  const onNextClick = () => setPage(Math.max(0, page) + limit);

  useEffect(() => {
    if (page < 0) {
      return;
    }

    props.prismic
      .load({ variables: { after: btoa(`arrayconnection:${page}`) } })
      .then(res => setData(res.data));
  }, [page]);

  return (
    <Layout>
      <h3>List of articles</h3>
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
    </Layout>
  );
};

export default Home;
