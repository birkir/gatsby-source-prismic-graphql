declare module 'jsonfn' {
  namespace JSONfn {
    function parse(str: string): any;
    function stringify(fn: any): any;
  }
}

declare module 'gatsby-source-graphql/gatsby-node' {
  function sourceNodes(ref: any, options: any): any;
}

declare module 'gatsby/dist/utils/babel-parse-to-ast';
