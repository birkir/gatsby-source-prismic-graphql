import { ApolloClient } from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { PrismicLink } from './index';

let client: ApolloClient<any> | undefined = undefined;

export const getApolloClient = ({ repositoryName }: any): ApolloClient<any> => {
  if (!client) {
    client = new ApolloClient({
      cache: new InMemoryCache(),
      link: PrismicLink({
        uri: `https://${repositoryName}.prismic.io/graphql`,
        credentials: 'same-origin',
      }),
    });
  }
  return client;
};
