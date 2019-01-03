# gatsby-source-prismic-graphql

Source data from prismic via the GraphQL API

## Installing

Install module

```bash
npm install --save gatsby-source-prismic-graphql
```

Add plugin to `gatsby-config.js`:

```js
{
  resolve: 'gatsby-source-prismic-graphql',
  options: {
    repositoryName: 'gatsby-source-prismic-test-site', // (required)
    linkResolver(doc) { return '/' }, // Must be a pure function with no references
    accessToken: '...', // (optional)
    path: '/preview', // (optional)
    previews: true, // (optional, default: true)
  }
}
```

### Options

 * repositoryName - Your prismic repo name
 * linkResolver - function to resolve URL
 * path - where to put the preview page
 * previews - weither to enable previews or not

## Troubleshooting

Todo
