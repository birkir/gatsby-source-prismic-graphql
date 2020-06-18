# gatsby-source-prismic-graphql

A Gatsby plugin for fetching source data from the [Prismic headless CMS](https://prismic.io) using Prismic's beta [GraphQL API](https://prismic.io/docs/graphql/getting-started/integrate-with-existing-js-project). This plugin provides full support for Prismic's preview feature out of the box.

For more context, be sure to checkout Prismic's getting started guide: [Using Prismic With Gatsby](https://prismic.io/docs/reactjs/getting-started/prismic-gatsby). This README, however, serves as the most-up-to-date source of information on `gatsby-source-prismic-graphql`'s latest developments and breaking changes.

Please **be sure your Prismic repository has the GraphQL API enabled**. It is enabled by default on all new Prismic repositories. If you have an older repository or are unable to access `https://[your_repo].prismic.io/graphql`, please reach out to Prismic support to request the GraphQL API.

## Contents

- [Differences From gatsby-source-prismic](#differences-from-gatsby-source-prismic)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Automatic Page Generation](#automatic-page-generation)
  - [Support for Multiple Languages/Locales](#support-for-multiple-languages)
  - [Page Queries: Fetch Data From Prismic](#page-queries-fetch-data-from-prismic)
  - [Prismic Previews](#prismic-previews)
  - [StaticQuery & useStaticQuery](#staticquery-and-usestaticquery)
  - [Fragments](#fragments)
  - [Dynamic Queries & Fetching](#dynamic-queries-and-fetching)
  - [Pagination](#pagination)
  - [Working with gatsby-image](#working-with-gatsby-image)
  - [Prismic.io A/B Experiments Integration](#prismicio-content-ab-experiments-integration)
- [How This Plugin Works](#how-this-plugin-works)
- [Development](#development)
- [Issues & Troubleshooting](#issues-and-troubleshooting)

## Differences From `gatsby-source-prismic`

`gatsby-source-prismic-graphql` (this plugin) fetches data using Prismic's beta [GraphQL API](https://prismic.io/docs/graphql/getting-started/integrate-with-existing-js-project) and provides full support for Prismic's Preview feature out of the box. It also provides an easy-to-configure interface for page generation.

[`gatsby-source-prismic`](https://github.com/angeloashmore/gatsby-source-prismic) is a different plugin that fetches data using Prismic's REST and Javascript APIs. Previews must be coded up separately.

## Getting Started

**Install the plugin**

```bash
npm install --save gatsby-source-prismic-graphql
```

or

```bash
yarn add gatsby-source-prismic-graphql
```

**Add plugin to `gatsby-config.js` and configure**

```js
{
  resolve: 'gatsby-source-prismic-graphql',
  options: {
    repositoryName: 'gatsby-source-prismic-test-site', // required
    defaultLang: 'en-us', // optional, but recommended
    accessToken: '...', // optional
    prismicRef: '...', // optional, default: master; useful for A/B experiments
    path: '/preview', // optional, default: /preview
    previews: true, // optional, default: true
    pages: [{ // optional
      type: 'Article', // TypeName from prismic
      match: '/article/:uid', // pages will be generated under this pattern
      previewPath: '/article', // optional path for unpublished documents
      component: require.resolve('./src/templates/article.js'),
      sortBy: 'date_ASC', // optional, default: meta_lastPublicationDate_ASC; useful for pagination
    }],
    extraPageFields: 'article_type', // optional, extends pages query to pass extra fields
    sharpKeys: [
      /image|photo|picture/, // (default)
      'profilepic',
    ],
  }
}
```

**Edit your `gatsby-browser.js`**

```js
const { registerLinkResolver } = require('gatsby-source-prismic-graphql');
const { linkResolver } = require('./src/utils/linkResolver');

registerLinkResolver(linkResolver);
```

## Usage

### Automatic Page Generation

You can generate pages automatically by providing a mapping configuration under the `pages` option in `gatsby-config.js`.

Let's assume we have the following page configuration set:

```js
{
  pages: [{
    type: 'Article',
    match: '/blogpost/:uid',
    previewPath: '/blogpost',
    component: require.resolve('./src/templates/article.js'),
  }],
}
```

If you have two blog posts with UIDs of `foo` and `bar`, the following URL slugs will be generated:

- `/blogpost/foo`
- `/blogpost/bar`

If you create a new unpublished blogpost, `baz` it will be accessible for preview under, assuming you've established a preview session with Prismic:

- `/blogpost?uid=baz`

More on [Prismic Previews](#prismic-previews) below.

#### Conditionally generating pages

If the default page generation doesn't cover your use-case, you can provide an optional `filter` option to your individual page configurations.

For example, if you had a single Prismic _Article_ type and wanted pages with `music` in their UIDs to be generated at a different URL :

```js
{
  pages: [{
    type: 'Article',
    match: '/musicblog/:uid',
    filter: data => data.node._meta.uid.includes('music'),
    previewPath: '/blogposts',
    component: require.resolve('./src/templates/article.js'),
  }, {
    type: 'Article',
    match: '/blog/:uid',
    filter: data => !data.node._meta.uid.includes('music'),
    previewPath: '/blogposts',
    component: require.resolve('./src/templates/article.js'),
  }],
}
```

Given 3 articles with UIDs of `why-i-like-music`, `why-i-like-sports` and `why-i-like-food`, the following URL slugs will be generated:

- `/musicblog/why-i-like-music`
- `/blog/why-i-like-sports`
- `/blog/why-i-like-food`

### Generating pages from page fields

Sometimes the meta provided by default doesn't contain enough context to be able to filter pages effectively. By passing `extraPageFields` to the plugin options, we can extend what we can filter on.

```js
{
  extraPageFields: 'music_genre',
  pages: [{
    type: 'Article',
    match: '/techno/:uid',
    filter: data => data.node.music_genre === 'techno',
    previewPath: '/blogposts',
    component: require.resolve('./src/templates/article.js'),
  }, {
    type: 'Article',
    match: '/acoustic/:uid',
    filter: data => data.node.music_genre === 'acoustic',
    previewPath: '/blogposts',
    component: require.resolve('./src/templates/article.js'),
  }]
}
```

Given 2 articles with the `music_genre` field set, we'll get the following slugs:

/techno/darude
/acoustic/mik-parsons

### Support for Multiple Languages

Prismic allows you to create your content in multiple languages. This library supports that too. When setting up your configuration options in `gatsby-config.js`, there are three _optional_ properties you should be aware of: `options.defaultLang`, `options.langs`, and `options.pages[i].langs`. In the following example, all are in use:

```js
{
  resolve: 'gatsby-source-prismic-graphql',
  options: {
    repositoryName: 'gatsby-source-prismic-test-site',
    defaultLang: 'en-us',
    langs: ['en-us', 'es-es', 'is'],
    path: '/preview',
    previews: true,
    pages: [{
      type: 'Article',
      match: '/:lang?/:uid',
      previewPath: '/article',
      component: require.resolve('./src/templates/article.js'),
      sortBy: 'date_ASC',
      langs: ['en-us', 'es-es', 'is'],
    }, {
      type: "Noticias",
      match: '/noticias/:uid',
      previewPath: '/noticias',
      component: require.resolve('./src/templates/noticias.js'),
      sortBy: 'date_ASC',
      langs: ['es-es'],
    }],
  }
}
```

In the example above, pages are generated for two document types from Prismic--Articles and Noticias. The latter consists of news stories in Spanish. There are three languages total in use in this blog: US English, Traditional Spanish and Icelandic.

For Articles, we are instructing the plugin to generate pages for articles of all three languages. But, because there is a question mark (`?`) after the `:lang` portion of the `match` property (`/:lang?/:uid`), we only include the locale tag in the URL slug for languages that are not the `defaultLang` specified above (_i.e._, 'en-us'). So for the following languages, these are the slugs generated:

- US English: `/epic-destinations`
- Spanish: `/es-es/destinos-increibles`
- Icelandic: `/is/reykjadalur`

If we had not specified a `defaultLang`, the slug for US English would have been `/en-us/epic-destinations`. And, in fact, including the `langs: ['en-us', 'es-es', 'is']` declaration for this particular document type (`Articles`) is unnecessary because we already specified that as the default language set right after `defaultLang` in the plugin options.

For Noticias, however, we only want to generate pages for Spanish documents of that type (`langs` is `[es-es]`). We decide that in this context, no locale tag is needed in the URL slug; "noticias" is already enough indication that the contents are in Spanish. So we omit the `:lang` match entirely and specify only `match: '/noticias/:uid'`.

This is an example of how these three properties can be used together to offer maximum flexibility. To see this in action, check out the [languages example app](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/languages).

#### (Optional) Short language codes

To use short language codes (_e.g. `/fr/articles`_) instead of the default (_e.g. `/fr-fr/articles`_), you can set `options.shortenUrlLangs` to `true`.

Keep in mind that if you use this option & have multiple variants of a language (e.g. _en-us_ and _en-au_) that would be shortened to the same value, you should add UIDs to your URLs to differentiate them.

### Page Queries: Fetch Data From Prismic

It is very easy to fetch data from Prismic in your pages:

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
  <h2>{RichText.render(data.prismic.description)}</h2>
</>
```

### Prismic Previews

Previews are enabled by default, however they must be configured in your prismic instance/repository. For instructions on configuring previews in Prismic, refer to Prismic's guide: [How to set up a preview](https://user-guides.prismic.io/preview/how-to-set-up-a-preview/how-to-set-up-a-preview).

When testing previews, be sure you are starting from a valid Prismic preview URL/path. The most reliable way to test previews is by using the preview button from your draft in Prismic. If you wish to test the Preview locally, catch the URL that opens immediately after clicking the preview link:

`https://[your-domain.tld]/preview?token=https%3A%2F%[your-prismic-repo].prismic.io%2Fpreviews%2FXRag6xAAACA...ABwjduaa%3FwebsitePreviewId%3DXRA...djaa&documentId=XRBH...jduAa`

Then replace the protocol and domain at the beginning of the URL with your `localhost:PORT` instance, or wherever you're wanting to preview from.

This URL will be parsed and replaced by the web app and browser with the proper URL as specified in your page configuration.

### StaticQuery and useStaticQuery

You can use `StaticQuery` as usual, but if you would like to preview them, you must use the `withPreview` function.

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

`useStaticQuery` is not yet supported.

### Fragments

Fragments are supported for both page queries and static queries.

[See the example](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/fragments)

**Within page components**:

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

**With StaticQuery**:

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

### Dynamic Queries and Fetching

You can use this plugin to dynamically fetch data for your component using `prismic.load`. Refer to the [pagination example](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/pagination) to see it in action.

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
      variables: { limit: 20 },
      query, // (optional)
      fragments: [], // (optional)
    });

  return (
    // ... data
    <button onClick={handleClick}>load more</button>
  );
}
```

### Pagination

Pagination can be accomplished statically (_i.e._, during initialy page generation) or dynamically (_i.e._, with JS in the browser). Examples of both can be found in the [pagination example](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/pagination).

Prismic pagination is cursor-based. See Prismic's [Paginate your results](https://prismic.io/docs/graphql/query-the-api/paginate-your-results) article to learn about cursor-based pagination.

By default, pagination will be sorted by last publication date. If you would like to change that, specify a `sortBy` value in your page configuration in `gatsby-config.js`.

#### Dynamically-Generated Pagination

When coupled with `prismic.load`, as demonstrated in the [index page of the pagination example](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/pagination), other pages can be fetched dynamically using page and cursor calculations.

GraphQL documents from Prismic have a cursor--a base64-encoded string that represents their order, or page number, in the set of all documents queried. We provide two helpers for converting between cursor strings and page numbers:

- `getCursorFromDocumentIndex(index: number)`
- `getDocumentIndexFromCursor(cursor: string)`

#### Statically-Generated Pagination

##### Basic Pagination

For basic linking between the pages, metadata for the previous and next pages are provided to you automatically via `pageContext` in the `paginationPreviousMeta` and `paginationNextMeta` properties. These can be used in conjunction with your `linkResolver` to generate links between pages without any additional GraphQL query. For an example of this, take a look at the `<Pagination />` component in the pagination example's [`article.js`](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/pagination/src/templates/article.js).

##### Enhanced Pagination

If you would like to gather other information about previous and next pages (say a title or image), simply modify your page query to retrieve those documents. This also is demonstrated in the same [pagination example](https://github.com/birkir/gatsby-source-prismic-graphql/tree/master/examples/pagination/src/templates/article.js) with the `<EnhancedPagination />` component and the page's GraphQL query.

### Working with gatsby-image

The latest versions of this plugin support gatsby-image by adding a new property to GraphQL types that contains fields that match the `sharpKeys` array (this defaults to `/image|photo|picture/`) to the `Sharp` suffix.

**Note:** When querying, make sure to also query the source field. For example:

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

**NOTE** Images are not transformed in preview mode, so be sure to fall back to the default image when the sharp image is `null`.

```tsx
import Img from 'gatsby-image';
import get from 'lodash/get';

// ...

const sharpImage = get(data, 'prismic.Author.profile_pictureSharp.childImageSharp.fluid');
return sharpImage ? (
  <Img fluid={sharpImage} />
) : (
  <img src={get(data, 'prismic.Author.profile_picture.url')} />
);
```

Later, we may add an `Image` component that does this for you and leverages the new Prismic Image API as a fallback for preview modes.

### Prismic.io Content A/B Experiments Integration

You can use this plugin in combination with Prismic's built-in experiments functionality, and a hosting service like Netlify, to run content A/B tests.

Experiments in Prismic are basically branches of the core content, split into 'refs' similar to git branches. So if you want to get content from a certain experiment variation, you can pass the corresponding ref through to Prismic in your request, and it will return content based on that ref's variation.

A/B experiments are tricky to implement in a static website though; A/B testing needs a way to dynamically serve up the different variations to different website visitors. This is at odds with the idea of a static, non-dynamic website.

Fortunately, static hosting providers like Netlify allow you to run A/B tests at a routing level. This makes it possible for us to build multiple versions of our project using different source data, and then within Netlify
split traffic to our different static variations.

Therefore, we can use A/B experiments from Prismic in the following way:

1. Setup an experiment in Prismic.

2. Create a new git branch of your project which will be used to get content. You will need to create a separate git branch for each variation.

3. In that git branch, edit/add the optional 'prismicRef' parameter (documented above). The value of this should be the ref of the variation this git branch is for.

4. Push the newly created branch to your git repo.

5. Now go to your static hosting provider (we'll use Netlify in this example), and setup split testing based on your git branches/Prismic variations.

6. Now your static website will show different experimental variations of the content to different users! At this point the process is manual and non-ideal, but hopefully we'll be able to automate it more in the future.

## How This Plugin Works

1. The plugin creates a new page at `/preview` (by default, you can change this), that will be your preview URL you setup in the Prismic admin interface.

   It will automatically set cookies based on the query parameters and attempt to find the correct page to redirect to with your linkResolver.

2. It uses a different `babel-plugin-remove-graphql-queries` on the client.

   The modified plugin emits your GraphQL queries as a string so they can be read and re-used on the client side by the plugin.

3. Once redirected to a page with the content, everything will load normally.

   In the background, the plugin takes your original Gatsby GraphQL query, extracts the Prismic subquery and uses it to make a GraphQL request to Prismic with a preview reference.

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

Please raise an issue on GitHub if you have any problems.

### My page GraphQL query does not hot-reload for previews

This is a Gatsby limitation. You can bypass this limitation by adding the following:

```jsx
export const query = graphql` ... `;
const MyPage = () => { ... };

MyPage.query = query; // <-- set the query manually to allow hot-reload.
```
