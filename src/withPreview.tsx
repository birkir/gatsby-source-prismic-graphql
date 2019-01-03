import React from 'react';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-boost';
import Prismic from 'prismic-javascript';
import { getIsolatedQuery } from 'gatsby-source-graphql-universal';
import { PrismicLink, getCookies, fieldName, typeName } from './utils';
import gql from 'graphql-tag';

interface IPreviewProps {
  data: any;
  loadPreview?(query?: IGatsbyQuery): void
}

interface IPreviewState {
  data: any;
}

interface IGatsbyQuery {
  id: string;
  source: string;
}

const clients = new Map();

const getClient = (name: string) => {
  if (!clients.has(name)) {
    clients.set(name, new ApolloClient({
      cache: new InMemoryCache(),
      link: PrismicLink({
        uri: `https://${name}.prismic.io/graphql`,
        credentials: 'same-origin',
      }),
    }));
  }
  return clients.get(name);
}

export function withPreview<P extends object>(
  ComposedComponent: React.ComponentType<P | IPreviewProps>,
  { repositoryName, query }: { repositoryName?: string; query?: IGatsbyQuery } = {}
) {
  let repoName = repositoryName || '';
  let querySource = query && query.source;

  if (typeof window !== 'undefined' && !repoName) {
    const registry = (window as any).___graphqlUniversal;
    if (registry.prismic && registry.prismic.url) {
      repoName = registry.prismic.url.replace(/https:\/\//, '').split('.')[0];
    }
  }

  const compQuery = (ComposedComponent as any).query;

  if (!querySource && compQuery && compQuery.source) {
    querySource = compQuery.source;
  }

  return class extends React.Component<IPreviewProps, IPreviewState> {

    state = {
      data: this.props.data
    }

    componentDidMount() {
      this.setup()
    }

    setup = () => {
      if (typeof window !== 'undefined' && document.cookie) {
        const cookies = getCookies();
        if (querySource && (cookies.has(Prismic.experimentCookie) || cookies.has(Prismic.previewCookie))) {
          this.loadPreview();
        }
      }
    }

    loadPreview = async (proposedQuery?: IGatsbyQuery, proposedRepoName?: string) => {
      if (proposedQuery && proposedQuery.source) {
        querySource = proposedQuery.source;
      }

      if (!querySource) {
        console.warn('gatsby-source-prismic-graphql: Did not find query source. You can set with `this.props.setQuery(query)`.');
        return;
      }

      const client = getClient(proposedRepoName || repoName);

      const res = await client.query({
        query: getIsolatedQuery(gql(querySource), fieldName, typeName),
        fetchPolicy: 'network-only',
      });

      if (!res.errors && res.data) {
        const rootValue = (this.state.data && this.state.data[fieldName]) || {};
        this.setState({
          data: {
            ...this.state.data,
            [fieldName]: {
              ...rootValue,
              ...res.data,
            },
          },
        });
      }
    }

    render() {
      return (
        <ComposedComponent
          {...this.props}
          loadPreview={this.loadPreview}
          data={this.state.data}
        />
      );
    }
  }
}
