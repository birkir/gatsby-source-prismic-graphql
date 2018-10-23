import React from 'react'
import { Link, graphql } from 'gatsby'

import Layout from '../components/layout'

class IndexPage extends React.Component {
  componentDidMount() {
    console.log('IndexPage', this);
  }
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

export const query = graphql`
  query OtherQuery {
    site {
      siteMetadata {
        title
      }
    }
  }
`;

export default IndexPage
