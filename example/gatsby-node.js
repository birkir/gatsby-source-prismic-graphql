/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it

const path = require('path');

exports.createPages = ({ graphql, actions }) => {

  const { createPage } = actions

  return new Promise((resolve, reject) => {
    graphql(`
      query {
        prismic {
          allAuthors {
            edges {
              node {
                _meta {
                  id
                }
                name
              }
            }
          }
        }
      }
    `).then(result => {
      result.data.prismic.allAuthors.edges.forEach(({ node }) => {
        createPage({
          path: node._meta.id,
          component: path.resolve(`./src/templates/author.js`),
          context: {
            id: node._meta.id,
          },
        })
      })
      resolve()
    })
  })
}
