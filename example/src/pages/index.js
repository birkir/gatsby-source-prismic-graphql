import React from 'react'
import { Link, graphql } from 'gatsby'
import Layout from '../components/layout'
// import { withPreview } from 'gatsby-source-prismic-graphql/withPreview';

export const query = graphql`
  query {
    prismic {
      allArticles {
        edges {
          node {
            title
          }
        }
      }
    }
  }
`;

class IndexPage extends React.Component {

  static query = query;

  componentDidMount() {
    console.log('IndexPage.props', this.props);
  }

  render() {
    return (
      <Layout>
        <h1>Hi people</h1>
        {console.log('data', this.props.data)}
        <p>Welcome to your new Gatsby site.</p>
        <p>Now go build something great.</p>
        <Link to="/page-2/">Go to page 2</Link>
      </Layout>
    );
  }
}

export default IndexPage;
