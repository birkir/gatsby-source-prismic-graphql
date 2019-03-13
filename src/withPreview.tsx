import React from 'react';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-boost';
import Prismic from 'prismic-javascript';
import { merge } from 'lodash';
import { PrismicLink, getCookies} from './utils';
import Preview from './utils/Preview'
import { GraphQLError } from 'gatsby-source-prismic-graphql/node_modules/@types/graphql';
import URL from './utils/url';
import { DocumentMetadata } from './models/DocumentMetadata';

import gql from 'graphql-tag'

interface IPreviewProps {
  children?: any;
  pageContext: any;
  prismic: {
    loading: boolean;
    error: any;
  };
}

interface IPreviewState {
  data: any;
  error: any;
  loading: boolean;
}

let client: ApolloClient<any> | undefined = undefined;

const getClient = (): ApolloClient<any> => {
  if (!client) {
    let repositoryName: string = '';
    if (typeof window !== 'undefined') {
      const registry = (window as any).___sourcePrismicGraphql;
      if (registry.repositoryName) {
        repositoryName = registry.repositoryName;
      }
    }
    client = new ApolloClient({
      cache: new InMemoryCache(),
      link: PrismicLink({
        uri: `https://${repositoryName}.prismic.io/graphql`,
        credentials: 'same-origin'
      })
    });
  }
  return client;
};
export function withPreview<P extends object>(
  ComposedComponent?: React.ComponentType<P | IPreviewProps> & { query: any }
) {
  return class extends React.Component<IPreviewProps, IPreviewState> {
    constructor(props: IPreviewProps) {
      super(props)

      this.state = {
        // proxy data to state
        data: props.pageContext.data || null,
        loading: this.isPreviewMode(),
        error: null
      };
    }

    componentDidMount() {
      if(this.state.loading) this.load()
    }

    isPreviewMode() {
      if (typeof window !== 'undefined' && document.cookie) {
        const cookies = getCookies();
        return cookies.has(Prismic.experimentCookie) || cookies.has(Prismic.previewCookie)
      } else {
        return false
      }
    }

    buildMeta(pattern: string, customType?: string) {
      const parsedUrl = URL.parse(pattern, (window as any).location.pathname)
      return {
        uid: parsedUrl.uid,
        lang: parsedUrl.lang,
        customType
      } as DocumentMetadata
    }

    buildPreviewQuery() {
      const { _PRISMIC_PREVIEW_QUERY_FN_, _PRISMIC_PREVIEW_QUERY_, _PRISMIC_URL_PATTERN_, _PRISMIC_CUSTOM_TYPE_ } = this.props.pageContext
      if(_PRISMIC_PREVIEW_QUERY_) {
        return _PRISMIC_PREVIEW_QUERY_
      } else if(_PRISMIC_PREVIEW_QUERY_FN_) {
        const docMeta = this.buildMeta(_PRISMIC_URL_PATTERN_, _PRISMIC_CUSTOM_TYPE_)
        return Preview.convertToGraphQL(_PRISMIC_PREVIEW_QUERY_FN_, docMeta)
      }
      else return null
    }

    async queryDoc(client: ApolloClient<any>, query: any, variables?: { [key: string]: string }): Promise<[ReadonlyArray<GraphQLError> | null, any | null]> {
      const res = await client.query<any>({
        query,
        fetchPolicy: 'network-only',
        variables
      })
      const q = query
      const prefix = (() => {
        const def = q.definitions[0] || {}
        const selection = (def.selectionSet || { selections: [] }).selections[0]
        return selection && selection.name ? selection.name.value : null
      })()
      if(res.errors) return [res.errors, null]
      else if(res.data && prefix) return [null, res.data[prefix].edges.length > 0 ? res.data[prefix].edges[0].node : null]
      else return [null, null]
    }

    load = async (variables?: { [key: string]: string }) => {
      const client = getClient();
      try {
        this.setState({ error: false });
        const query = this.buildPreviewQuery()
        if(query) {
          const [errors, data] = await this.queryDoc(client, query, variables)
          if (!errors && data) {
            this.setState({
              loading: false,
              data: merge(this.state.data, data)
            });
          } else {
            this.setState({ error: errors, loading: false });
          }
        } else {
          this.setState({
            loading: false
          });
          console.error('Failed to fetch preview');
        }
      } catch (err) {
        console.error('Failed to fetch preview', err);
      }
    };

    render() {
      const prismic = {
        loading: this.state.loading,
        error: this.state.error
      };

      if(prismic.loading) return null
      if ((!ComposedComponent || !this.state.data)) return null // return 404
      return (
        <ComposedComponent
          {...this.props}
          prismic={prismic}
          pageContext={Object.assign({}, this.props.pageContext, {data: this.state.data})}
        />
      );
    }
  };
}
