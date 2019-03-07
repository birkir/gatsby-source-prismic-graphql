declare module 'gatsby-source-graphql-universal';
declare module 'gatsby-source-graphql-universal/gatsby-node';
declare module 'gatsby-source-graphql-universal/gatsby-ssr';

declare module 'jsonfn' {
  namespace JSONfn {
    function parse(str: string): any
    function stringify(fn: any): any
  }
}
