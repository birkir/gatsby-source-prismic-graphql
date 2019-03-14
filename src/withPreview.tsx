import React from 'react';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-boost';
import Prismic from 'prismic-javascript';
import { getIsolatedQuery } from 'gatsby-source-graphql-universal';
import { merge, omitBy, isObject } from 'lodash';
import { PrismicLink, getCookies, fieldName, typeName } from './utils';

export interface IPreviewProps {
  children?: any;
  data: any;
  pageContext: {
    [key: string]: any;
  };
  prismic: {
    loading: boolean;
    error: any;
    load(variables?: { [key: string]: any }): void;
  };
}

export interface IPreviewState {
  data: any;
  error: any;
  loading: boolean;
}

export interface IGatsbyQuery {
  id: string;
  source: string;
}

let client: ApolloClient<any> | undefined = undefined;

const getClient = (): ApolloClient<any> => {
  if (!client) {
    let repositoryName: string = '';
    let linkOptions = {};
    let memoryCache;
    if (typeof window !== 'undefined') {
      const registry = (window as any).___sourcePrismicGraphql;
      if (registry.repositoryName) {
        repositoryName = registry.repositoryName;
      }
      if (registry.linkOptions) {
        linkOptions = registry.linkOptions;
      }
      if (registry.fragmentMatcher) {
        const fragmentMatcher = new IntrospectionFragmentMatcher({
          introspectionQueryResultData: registry.fragmentMatcher
        });
        memoryCache = { fragmentMatcher };
      }
    }

    client = new ApolloClient({
      cache: new InMemoryCache(memoryCache),
      link: PrismicLink({
        uri: `https://${repositoryName}.prismic.io/graphql`,
        credentials: 'same-origin',
        ...linkOptions,
      })
    });
  }
  return client;
};

export function withPreview<P extends object>(
  ComposedComponent?: React.ComponentType<P | IPreviewProps> & { query: any },
  query?: IGatsbyQuery
) {
  return class extends React.Component<IPreviewProps, IPreviewState> {
    state = {
      // proxy data to state
      data: this.props.data,
      loading: false,
      error: null
    };

    componentDidMount() {
      if (typeof window !== 'undefined' && document.cookie) {
        const registry = (window as any).___sourcePrismicGraphql;
        const cookies = getCookies();
        if (
          cookies.has(Prismic.experimentCookie) ||
          cookies.has(Prismic.previewCookie)
        ) {
          if (registry && registry.previews) {
            this.load();
          }
        }
      }
    }

    load = async (variables: { [key: string]: string } = this.props.pageContext) => {
      const client = getClient();
      try {
        this.setState({ loading: true, error: false });
        const res = await client.query({
          query: getIsolatedQuery(query, fieldName, typeName),
          fetchPolicy: 'network-only',
          variables: omitBy(variables, isObject),
        });

        if (!res.errors && res.data) {
          this.setState({
            loading: false,
            data: merge(this.state.data, { [fieldName]: res.data })
          });
        } else {
          this.setState({ error: res.errors, loading: false });
        }
      } catch (err) {
        console.error('Failed to fetch preview', err);
      }
    };

    render() {
      const prismic = {
        loading: this.state.loading,
        error: this.state.error,
        load: this.load
      };

      if (!ComposedComponent) {
        return React.cloneElement(this.props.children, {
          ...this.props,
          prismic,
          data: this.state.data
        });
      }

      return (
        <ComposedComponent
          {...this.props}
          prismic={prismic}
          data={this.state.data}
        />
      );
    }
  };
}
