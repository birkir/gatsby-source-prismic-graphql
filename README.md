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

```jsx
import React from 'react';
import { RichText } from 'prismic-reactjs';

export const query = graphql`
  {
    prismic {
      page(uid:"homepage", lang:"en-us") {
        title
        description
      }
    }
  }
`

const Page = ({ data }) => <>
  <h1>{RichText.render(data.prismic.title)}</h1>
  <h2>{RichText.render(data.prismic.description)}</h1>
</>
```

### Prismic Previews

You can enable previews by setting `options.previews = true` in `gatsby-config.js`.

#### Assign graphql query to component

By default, the plugin will wrap components with the preview decorator, but you will have to assign a proper query to the component.

```jsx
// Given the following query
export const query = graphql`
  query {
    prismic {
      ...
    }
  }
`

const Page = ({ data }) => (...);
Page.query = query; // <-- Assign with object property assignment

// or

class Page extends React.Component {
  static query = query; // <-- Assign with `static` class assignment
  render() { ... }
}
```

#### Manual usage

You can also have full control over your page components and use the built in higher order component like this:

```jsx
import React from 'react';
import { withPreview } from 'gatsby-source-prismic-graphql';

export const query = graphql`
  query {
    prismic {
      ...
    }
  }
`;

const Page = ({ data }) => (...);

export default withPreview(Page, query);
```

### Pagination and other dynamic fetching

You can use this plugin to dynamically fetch different component for your component. This is great for cases like pagination. See the following example:

```jsx
import React from 'react'
import { graphql } from 'gatsby';

export const query = graphql`
  query allArticles(
    $first: Int = 2
    $last: Int
    $after: String
    $before: String
  ) {
    prismic {
      allArticles(
        first: $first
        last: $last
        after: $after
        before: $before
      ) {
        pageInfo {
          startCursor
          endCursor
        }
        edges {
          node {
            _meta {
              id
            }
            title
          }
        }
      }
    }
  }
`;

export default class Article extends React.Component {

  static query = query;

  onNext = () => {
    const { prismic, data: { prismic: { allArticles: { pageInfo }}} } = this.props;
    return prismic.load({ after: pageInfo.endCursor });
  }

  onPrev = () => {
    const { prismic, data: { prismic: { allArticles: { pageInfo }}} } = this.props;
    // Prismic uses cursor based pagination
    // But its actually just base64 encoded string if you want to maintain your own page state.
    // for example: const cursor = btoa(`arrayconnection:${index}`);
    return prismic.load({ before: pageInfo.startCursor, first: null, last: 2 });
  }

  renderArticleEdge = ({ node }) => {
    return <li key={node._meta.id}>{node.title[0].text}</li>
  }

  render() {
    const { edges } = this.props.data.prismic.allArticles;
    return <>
      <h1>List of articles</h1>
      <ul>{edges.map(this.renderArticleEdge)}</ul>
      <button onClick={this.onPrev}>prev</button>
      <button onClick={this.onNext}>next</button>
    </>
  }
}
```

### Previewing non-existing page

You may have a case where you are trying to preview a page that hasn't been published yet. We included a special component resolver for these cases to help with this issue.

Edit your `gatsby-browser.js`:
```js
const { registerResolvers } = require('gatsby-source-prismic-graphql');
const { linkResolver } = require('./src/utils/linkResolver');

const componentResolver = (doc) => {
  if (doc.type === 'article') {
    return require('./src/pages/article.js');
  }
  return () => null;
}

registerResolvers(linkResolver, componentResolver);
```

## How this plugin works

1. The plugin creates a new page at `/preview` (by default, you can change this), that will be your preview URL you setup in the Prismic admin interface.

   It will automatically set cookies based on the query parameters and attempt to find the correct page to redirect to with your linkResolver.

   If the linkResolver will not find a page, it will attempt to use the `componentResolver` to render the correct page inline.

2. It uses a different `babel-plugin-remove-graphql-queries` on the client.

   The modified plugin emits your graphql queries as string so they can be read and re-used on the client side by the plugin.

3. Once redirected to a page with the content, everything will load normally.

   In the background, the plugin takes your  original gatsby graphql query, extracts the prismic subquery and uses it to make a graphql request to Prismic with a preview reference.

   Once data is received, it will update the `data` prop with merged data from Prismic preview and re-render the component.

## Issues and Troubleshooting

This plugin does not have gatsby-plugin-sharp support.

Please raise an issue on GitHub if you have any problems.
