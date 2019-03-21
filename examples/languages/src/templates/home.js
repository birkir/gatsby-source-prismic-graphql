import { Link, graphql } from 'gatsby';
import React from 'react';
import Layout from '../components/layout';
import { get } from 'lodash';
import { RichText } from 'prismic-reactjs';

export const query = graphql`
  query Homepage($id: String) {
    prismic {
      allHomepages(id: $id) {
        edges {
          node {
            _meta {
              id
              lang
            }
            column_title
          }
        }
      }
    }
  }
`;

export default function Home(props) {
  const { column_title } = get(props.data, 'prismic.allHomepages.edges.0.node', {});
  const lang = get(props.pageContext, 'alternateLanguages.0.lang', '').replace('en-us', '');

  return (
    <Layout>
      {RichText.render(column_title)}
      <Link to={`/${lang}`}>Click here for alternative language</Link>
    </Layout>
  );
}
