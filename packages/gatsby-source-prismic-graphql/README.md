# gatsby-source-prismic-graphql

Source data from Prismic with GraphQL

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
    prismicRef: '...', // (optional, if not used then defaults to master ref. This option is useful for a/b experiments)
    path: '/preview', // (optional, default: /preview)
    previews: true, // (optional, default: false)
    pages: [{ // (optional)
      type: 'Article',         // TypeName from prismic
      match: '/article/:uid',  // Pages will be generated under this pattern (optional)
      path: '/article',        // Placeholder page for unpublished documents
      component: require.resolve('./src/templates/article.js'),
    }],
    sharpKeys: [
      /image|photo|picture/, // (default)
      'profilepic',
    ],
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

Previews are enabled by default.

[Read how to enable previews](https://user-guides.prismic.io/preview/how-to-set-up-a-preview/how-to-set-up-a-preview) in your prismic instance.

### Generated pages

You can generate pages automatically by providing mapping configuration under the `pages` option.

If you have two blog posts like `foo`, `bar`, it will generate the following URLs:

- /blogpost/foo
- /blogpost/bar

If you create a new unpublished blogpost, `baz` it will be accessible for preview under:

- /blogpost?uid=baz

[See the example](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/default)

```js
{
  pages: [{
    type: 'Article',
    match: '/blogpost/:uid',
    path: '/blogpost',
    component: require.resolve('./src/templates/article.js'),
  }],
}
```

### StaticQuery

You can use static queries like normal, but if you would like to preview them, use the `withPreview` function.

[See the example](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/static-query)

```js
import { StaticQuery, graphql } from 'gatsby';
import { withPreview } from 'gatsby-source-prismic-graphql';

const articlesQuery = graphql`
  query {
    prismic {
      ...
    }
  }
`;

export const Articles = () => (
  <StaticQuery
    query={articlesQuery}
    render={withPreview(data => { ... }, articlesQuery)}
  />
);
```

### useStaticQuery

No support yet.

### Fragments

Fragments are supported for both page queries and static queries.

[See the example](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/fragments)

**Page components**:

```jsx
import { graphql } from 'gatsby';

const fragmentX = graphql` fragment X on Y { ... } `;

export const query = graphql`
  query {
    ...X
  }
`;

const MyPage = (data) => { ... };
MyPage.fragments = [fragmentX];

export default MyPage;
```

**StaticQuery**:

```jsx
import { StaticQuery, graphql } from 'gatsby';
import { withPreview } from 'gatsby-source-prismic-graphql';

const fragmentX = graphql` fragment X on Y { ... } `;

export const query = graphql`
  query {
    ...X
  }
`;

export default () => (
  <StaticQuery
    query={query}
    render={withPreview(data => { ... }, query, [fragmentX])}
  />
);

```

### Pagination and other dynamic fetching

You can use this plugin to dynamically fetch different component for your component. This is great for cases like pagination. See the following example:

[See the example](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/pagination)

```jsx
import React from 'react';
import { graphql } from 'gatsby';

export const query = graphql`
  query Example($limit: Int) {
    prismic {
      allArticles(first: $limit) {
        edges {
          node {
            title
          }
        }
      }
    }
  }
`;

export default function Example({ data, prismic }) {
  const handleClick = () =>
    prismic.load({
      variables: { limit: 100 },
      query, // (optional)
      fragments: [], // (optional)
    });

  return (
    // ... data
    <button onClick={handleClick}>load more</button>
  );
}
```

### Working with gatsby-image

Latest version of the plugin supports gatsby-image by adding a new property to graphql types that contain fields that match the `sharpKeys` array (this defaults to `/image|photo|picture/`) with the `Sharp` suffix.

**Note:** When querying, make sure to also query the source field, eg.

```gql
query {
  prismic {
    Article(id: "123") {
      title
      articlePhoto
      articlePhotoSharp {
        childImageSharp {
          fluid(maxWidth: 400, maxHeight: 250) {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  }
}
```

You can also get access to specific crop sizes from Prismic by passing the `crop` argument:

```gql
query {
  prismic {
    Author(id: "123") {
      name
      profile_picture
      profile_pictureSharp(crop: "face") {
        childImageSharp {
          fluid(maxWidth: 500, maxHeight: 500) {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  }
}
```

**NOTE** Does not transform images in preview mode, so make sure to fallback to the default image when the sharp image is null.

```tsx
import Img from 'gatsby-image';
import get from 'lodash/get';

// ...

const sharpImage = get(data, 'prismic.Author.profile_pictureShap.childImageSharp.fluid');
return sharpImage ? (
  <Img fluid={sharpImage} />
) : (
  <img src={get(data, 'prismic.Author.profile_picture.url')} />
);
```

Later we may add a Image component that does this for you, and leverages the new Prismic Image API as fallback for preview modes.

### Prismic.io content a/b experiments integration

You can use this plugin in combination with Prismic's built-in experiments functionality, and a hosting service like Netlify, to run content a/b tests.

Experiments in Prismic are basically branches of the core content, split into 'refs' similar to git branches.
So if you want to get content from a certain experiment variation, you can pass the corresponding ref through to Prismic in your request,
and it will return content based on that ref's variation.

A/B experiments are tricky to implement in a static website though; a/b testing needs a way to dynamically serve up the different variations
to different website visitors. This is at odds with the idea of a static, non-dynamic website.

Fortunately, static hosting providers like Netlify allow you to run a/b tests at a routing level.
This makes it possible for us to build multiple versions of our project using different source data, and then within Netlify
split traffic to our different static variations.

Therefore, we can use a/b experiments from Prismic in the following way:

1. Setup an experiment in Prismic.

2. Create a new git branch of your project which will be used to get content. You will need to create a separate git branch for each variation.

3. In that git branch, edit/add the optional 'prismicRef' parameter (documented above). The value of this should be the ref of the variation this git branch is for.

4. Push the newly created branch to your git repo.

5. Now go to your static hosting provider (we'll use Netlify in this example), and setup split testing based on your git branches/Prismic variations.

6. Now your static website will show different experimental variations of the content to different users! At this point the process is manual and non-ideal, but hopefully we'll be able to automate it more in the future.

## How this plugin works

1. The plugin creates a new page at `/preview` (by default, you can change this), that will be your preview URL you setup in the Prismic admin interface.

   It will automatically set cookies based on the query parameters and attempt to find the correct page to redirect to with your linkResolver.

2. It uses a different `babel-plugin-remove-graphql-queries` on the client.

   The modified plugin emits your graphql queries as string so they can be read and re-used on the client side by the plugin.

3. Once redirected to a page with the content, everything will load normally.

   In the background, the plugin takes your original gatsby graphql query, extracts the prismic subquery and uses it to make a graphql request to Prismic with a preview reference.

   Once data is received, it will update the `data` prop with merged data from Prismic preview and re-render the component.

## Development

```bash
git clone git@github.com:birkir/gatsby-source-prismic-graphql.git
cd gatsby-source-prismic-graphql
yarn install
yarn setup
yarn start

# select example to work with
cd examples/default
yarn start
```

## Issues and Troubleshooting

This plugin does not have gatsby-plugin-sharp support.

Please raise an issue on GitHub if you have any problems.

### My page graphql query does not hot-reload for previews

This is a Gatsby limitation. You can bypass this limitation by adding the following:

```jsx
export const query = graphql` ... `;
const MyPage = () => { ... };

MyPage.query = query; // <-- set the query manually to allow hot-reload.
```
