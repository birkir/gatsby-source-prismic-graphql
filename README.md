# gatsby-source-prismic-graphql

Source data from Prismic with GraphQL

### Differences from `gatsby-source-prismic`

This plugin will require [graphql enabled](https://prismic.io/blog/graphql-api-alpha-release) in your Prismic instance.

The feature is currently in _alpha_ and not recommended in production. However that being said, by using Gatsby you have the garantee of production builds to never break as they are statically compiled.

## Installing

Install module

```bash
npm install --save gatsby-source-prismic-graphql
```

Add plugin to `gatsby-config.js`:

```js
// gatsby-config.js
import { linkResolver } from './src/linkResolver';

// ...
{
  resolve: 'gatsby-source-prismic-graphql',
  options: {
    repositoryName: 'gatsby-source-prismic-test-site', // (required)
    accessToken: '...', // (optional)
    path: '/preview', // (optional, default: /preview)
    previews: true, // (optional, default: true)
  }
}
```

Edit your `gatsby-browser.js`:
```js
// gatsby-browser.js
import { registerLinkResolver } from 'gatsby-source-prismic-graphql';
import { linkResolver } from './src/linkResolver';

registerLinkResolver(linkResolver);
```

### Options

 * repositoryName - Your prismic repo name
 * linkResolver - function to resolve URL
 * path - where to put the preview page
 * previews - weither to enable previews or not

### How this plugin works

1. The plugin creates a new page at `/preview` (by default, you can change this), that will be your preview URL you setup in the Prismic admin interface.

   It will automatically set cookies based on the query parameters and attempt to find the correct page to redirect to with your linkResolver.

   If the linkResolver will not find a page, it will attempt to use the `componentResolver` to render the correct page inline.

2. It uses a different `babel-plugin-remove-graphql-queries` on the client.

   The modified plugin emits your graphql queries as string so they can be read and re-used on the client side by the plugin.

3. Once redirected to a page with the content, everything will load normally.

   In the background, the plugin takes your  original gatsby graphql query, extracts the prismic subquery and uses it to make a graphql request to Prismic with a preview reference.

   Once data is received, it will update the `data` prop with merged data from Prismic preview and re-render the component.

## Troubleshooting

Todo
