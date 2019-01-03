const { linkResolver } = require('./src/utils/linkResolver');

module.exports = {
  siteMetadata: {
    title: 'Gatsby Prismic Preview Example',
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-source-prismic-graphql',
      options: {
        repositoryName: 'ueno-starter-kit-universally-test',
        linkResolver,
      }
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'gatsby-starter-default',
        short_name: 'starter',
        start_url: '/',
        background_color: '#663399',
        theme_color: '#663399',
        display: 'minimal-ui',
        icon: 'src/images/gatsby-icon.png', // This path is relative to the root of the site.
      },
    },
    // 'gatsby-plugin-offline',
  ],
}
