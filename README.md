# gatsby-source-prismic-graphql

Source data from Prismic with GraphQL

## Development

```
git clone git@github.com:birkir/gatsby-source-prismic-graphql.git
cd gatsby-source-prismic-graphql
yarn install
yarn setup
yarn start

# select example to work with
cd examples/default
yarn start
```

### Differences from `gatsby-source-prismic`

This plugin will require [graphql enabled](https://prismic.io/blog/graphql-api-alpha-release) in your Prismic instance.

The feature is currently in _alpha_ and not recommended in production. However that being said, by using Gatsby you have the garantee of production builds to never break as they are
statically compiled.

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
    pages: [{
      type: 'Article',         // TypeName from prismic
      match: '/blogpost/:uid', // Pages will be generated under this pattern
      path: '/blogpost',       // Placeholder page for unpublished documents
      component: require.resolve('./src/templates/article.js'),
    }],
  }
}
```

Edit your `gatsby-browser.js`:

```js
const { registerLinkResolver } = require('gatsby-source-prismic-graphql');
const { linkResolver } = require('./src/utils/linkResolver');

registerLinkResolver(linkResolver);
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

export default function Page({ data }) => <>
  <h1>{RichText.render(data.prismic.title)}</h1>
  <h2>{RichText.render(data.prismic.description)}</h1>
</>
```

### Prismic Previews

You can enable previews by setting `options.previews = true` in `gatsby-config.js`.

### Generated pages

You can generate pages automatically by providing mapping configuration under the `pages` option.

If you have two blog posts like `['foo', 'bar']`, it will generate the following URLs:

- /blogpost/foo
- /blogpost/bar

If you create a new blogpost for example `baz` it will be accessible under:

- /blogpost?uid=baz

```js
{
  pages: [{
    type: 'Article',
    match: '/blogpost/:uid',
    path: '/blogpost',
    component: require.resolve('./src/templates/article.js'),
  }, {
    type: 'CustomPage',
    match: '/:uid',
    path: '/custompage',
    component: require.resolve('./src/templates/page.js'),
  }],
}
```

### Pagination and other dynamic fetching

You can use this plugin to dynamically fetch different component for your component. This is great for cases like pagination. See the following example:

```jsx
import React from 'react';
import { graphql } from 'gatsby';

export const query = graphql`
  query allArticles($first: Int = 2, $last: Int, $after: String, $before: String) {
    prismic {
      allArticles(first: $first, last: $last, after: $after, before: $before) {
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
  onNext = () => {
    const {
      prismic,
      data: {
        prismic: {
          allArticles: { pageInfo },
        },
      },
    } = this.props;
    return prismic.load({ after: pageInfo.endCursor });
  };

  onPrev = () => {
    const {
      prismic,
      data: {
        prismic: {
          allArticles: { pageInfo },
        },
      },
    } = this.props;
    // Prismic uses cursor based pagination
    // But its actually just base64 encoded string if you want to maintain your own page state.
    // for example: const cursor = btoa(`arrayconnection:${index}`);
    return prismic.load({ variables: { before: pageInfo.startCursor, first: null, last: 2 } });
  };

  renderArticleEdge = ({ node }) => {
    return <li key={node._meta.id}>{node.title[0].text}</li>;
  };

  render() {
    const { edges } = this.props.data.prismic.allArticles;
    return (
      <>
        <h1>List of articles</h1>
        <ul>{edges.map(this.renderArticleEdge)}</ul>
        <button onClick={this.onPrev}>prev</button>
        <button onClick={this.onNext}>next</button>
      </>
    );
  }
}
```

## How this plugin works

1. The plugin creates a new page at `/preview` (by default, you can change this), that will be your preview URL you setup in the Prismic admin interface.

   It will automatically set cookies based on the query parameters and attempt to find the correct page to redirect to with your linkResolver.

   If the linkResolver will not find a page, it will attempt to use the `componentResolver` to render the correct page inline.

2. It uses a different `babel-plugin-remove-graphql-queries` on the client.

   The modified plugin emits your graphql queries as string so they can be read and re-used on the client side by the plugin.

3. Once redirected to a page with the content, everything will load normally.

   In the background, the plugin takes your original gatsby graphql query, extracts the prismic subquery and uses it to make a graphql request to Prismic with a preview reference.

   Once data is received, it will update the `data` prop with merged data from Prismic preview and re-render the component.

## Issues and Troubleshooting

This plugin does not have gatsby-plugin-sharp support.

Please raise an issue on GitHub if you have any problems.
