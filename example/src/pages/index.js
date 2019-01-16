import React from 'react'
import { Link, graphql } from 'gatsby'
import Layout from '../components/layout'

export const query = graphql`
  query {
    prismic {
      allArticles(
        uid_in: ["the-wordpress-question"]
      ) {
        edges {
          node {
            title
          }
        }
      }
    }
  }
`;

export default class IndexPage extends React.Component {

  static query = query;

  render() {
    const [edge] = this.props.data.prismic.allArticles.edges;
    const [title] = edge ? edge.node.title : [];
    return (
      <Layout>
        <h1>{title && title.text}</h1>
        <p>Welcome to your new Gatsby site.</p>
        <p>Now go build something great.</p>
        <Link to="/article/">Go to page 2</Link>
      </Layout>
    );
  }
}
