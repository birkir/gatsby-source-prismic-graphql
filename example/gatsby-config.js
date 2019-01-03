module.exports = {
  siteMetadata: {
    title: 'Gatsby Prismic Preview Example',
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-source-prismic',
      options: {
        repositoryName: 'ueno-starter-kit-universally-test',
        // accessToken: 'example-wou7evoh0eexuf6chooz2jai2qui9pae4tieph1sei4deiboj',
        linkResolver: ({ node, key, value }) => require('./src/linkResolver'),
      }
    },
    {
      resolve: 'gatsby-plugin-prismic-preview',
      options: {
        path: '/preview',
        repositoryName: 'ueno-starter-kit-universally-test',
        linkResolver: require('./src/linkResolver'),
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
