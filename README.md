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
{
  resolve: 'gatsby-source-prismic-graphql',
  options: {
    repositoryName: 'gatsby-source-prismic-test-site', // (required)
    accessToken: '...', // (optional)
    path: '/preview', // (optional, default: /preview)
    previews: true, // (optional, default: false)
  }
}
```

Edit your `gatsby-browser.js`:
```js
const { registerResolvers } = require('gatsby-source-prismic-graphql');
const { linkResolver } = require('./src/utils/linkResolver');

registerResolvers(linkResolver);
```

## Usage

### Fetch data from Prismic

It is very easy to fetch data from prismic.
You need to create a page from gatsby node and wrap the `createPages` function in the `createPages` exposed by this plugin

without the plugin
```js
exports.createPages = async ({graphql, actions}) => {
  // gatsby code
}
```

with the plugin
```js
exports.createPages = createPages(async ({graphql, actions}) => {
  // gatsby code
})
```
Once you've done this, you have two ways to create pages:
- createPage: A function exposed by gatsby to create a regular page
- createPrismicPage: A wrapper function that implements some mechanism to allow your component to be filled dynamically in case you're in a preview

A regular page:
```js
createPage({
  path: `/blogpost/${edge.node._meta.uid}`,
  component: path.resolve(path.join(__dirname, './src/components/blogpost.js')),
  context: {
    // some context
  }
});
```

A prismic page:
```js
createPrismicPage({
  pattern: `/blogpost/:uid`,
  params: {
    uid: edge.node._meta.uid
  },
  component: path.resolve(path.join(__dirname, './src/components/blogpost.js')),
  context: {
    data: edge.node
  }
});
```

To be able to generate pages with embedded previews, you'll have to set specific options while creating a prismic page:

- `pattern`: It represents the model of the url of your page with parameters like `uid`. It looks like the expresss.js model `/blogpost/:uid`
- `params`: This property represents all the url parameters that will be combine later by the plugin with the pattern
  - `params.uid`: If you have a url which rely on a prismic `uid`, you must explicitely put a `uid` param in your pattern
  - `params.lang`: If you have a url which rely on the language so you can fetch your content accordingly from prismic, you must explicitely put a `lang` param in your pattern
- `context.data`: When you create a prismic page, you need to provide the prismic document data as `data` option in your `context` so we can retrieve it and deliver it to your component.

You can refer to the examples above

### Prismic Previews

You can enable previews by setting `options.previews = true` in `gatsby-config.js`.

#### Component wrapper for your component

You have full control over your page components and use the built in higher order component like this:

```jsx
import React from 'react'
import { RichText } from 'prismic-reactjs'
import { linkResolver } from '../prismic/linkResolver'
import { withPreview } from 'gatsby-source-prismic-graphql'

const BlogPost = (props) => {
  const data = props.pageContext.data

  return (
    <div id="blogpost">
      <h1>{RichText.asText(data.title)}</h1>
      {RichText.render(data.body, linkResolver)}
    </div>
  )
}

export default withPreview(BlogPost)
```

## How this plugin works

1. The plugin creates a new page at `/preview` (by default, you can change this), that will be your preview URL you setup in the Prismic admin interface.

   It will automatically set cookies based on the query parameters and attempt to find the correct page to redirect to with your linkResolver.

2. Once redirected to a page with the content, everything will load normally.

   In the background, the plugin takes your  original gatsby graphql query, extracts the prismic subquery and uses it to make a graphql request to Prismic with a preview reference.

   Once data is received, it will update the `data` prop with merged data from Prismic preview and re-render the component.

## Issues and Troubleshooting

This plugin does not have gatsby-plugin-sharp support.

Please raise an issue on GitHub if you have any problems.
