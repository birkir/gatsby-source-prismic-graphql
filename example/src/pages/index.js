import React from 'react'
import { Link, graphql } from 'gatsby'
import Layout from '../components/layout'

export const query = graphql`
  query {
    allPrismicArticle {
      edges {
        node {
          id
          data {
            title {
              html
              text
            }
          }
        }
      }
    }
  }
`;

class IndexPage extends React.Component {
  render() {
    return (
      <Layout>
        <h1>Hi people</h1>
        <p>Welcome to your new Gatsby site.</p>
        <p>Now go build something great.</p>
        <Link to="/page-2/">Go to page 2</Link>
      </Layout>
    );
  }
}

IndexPage.query = query;

export default IndexPage;
