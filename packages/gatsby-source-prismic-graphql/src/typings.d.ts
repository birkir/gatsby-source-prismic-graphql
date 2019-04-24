declare module 'jsonfn' {
  namespace JSONfn {
    function parse(str: string): any;
    function stringify(fn: any): any;
  }
}

declare module 'gatsby-source-graphql-universal/gatsby-node' {
  function sourceNodes(ref: any, options: any): any;
  function onCreateWebpackConfig(): void;
  function getRootQuery(path: string): string | null;
}

declare module 'gatsby/dist/utils/babel-parse-to-ast';

declare module 'gatsby-source-graphql-universal/getRootQuery';
