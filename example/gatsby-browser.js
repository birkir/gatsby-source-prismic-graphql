/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */
const { registerResolvers } = require('gatsby-source-prismic-graphql');
const { linkResolver, componentResolver } = require('./src/utils/linkResolver');

registerResolvers(linkResolver, componentResolver);
