import React from 'react';
import { ApolloClient, InMemoryCache } from 'apollo-boost';
import { IntrospectionFragmentMatcher } from 'apollo-boost';
import { merge } from 'lodash';
import { PrismicLink, getCookies, Component404 } from './utils';
import Preview from './utils/Preview'
import { GraphQLError } from 'gatsby-source-prismic-graphql/node_modules/@types/graphql';
import URL from './utils/url';
import { DocumentMetadata } from './models/DocumentMetadata';
import Prismic from 'prismic-javascript'
import PreviewLoader from './PreviewLoader'

interface IPreviewProps {
  children?: any;
  pageContext: any;
  prismic: {
    loading: boolean;
    error: any;
  };
}

interface PrismicInfos {
  repositoryName: string
  accessToken: string
  previews: boolean
}
interface IPreviewState {
  data: any;
  error: any;
  loading: boolean;
  prismicInfos: PrismicInfos
}

let client: ApolloClient<any> | undefined = undefined;

//useful for apollo in memory cache when using union types/fragments while matching slices.
function introspectionQuery() {
  return `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        ...FullType
      }
      directives {
        name
        description
        locations
        args {
          ...InputValue
        }
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
      isDeprecated
      deprecationReason
    }
    inputFields {
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes {
      ...TypeRef
    }
  }

  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
  `
}

async function makeIntrospectionQuery(uri: string, repositoryName: string, accessToken: string): Promise<any> {
  const params = `?query=${encodeURIComponent(introspectionQuery())}`
  const ref = await getPrismicRef(repositoryName, accessToken)
  return fetch(uri + params, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Prismic-ref': ref
    } as HeadersInit
  }).then(r => r.json())
}
async function buildCache(uri: string, repositoryName: string, accessToken: string): Promise<InMemoryCache> {
  const introspection = await makeIntrospectionQuery(uri, repositoryName, accessToken)
  const filteredData = introspection.data.__schema.types.filter(
    (type: any) => type.possibleTypes !== null,
  )
  introspection.data.__schema.types = filteredData

  const fragmentMatcher = new IntrospectionFragmentMatcher({ introspectionQueryResultData: introspection.data })
  return new InMemoryCache({ fragmentMatcher })
}

async function getPrismicRef(repositoryName: string, accessToken: string) {
  const prismicClient = Prismic.client(`https://${repositoryName}/api`, { accessToken });

  const cookies = getCookies();
  if (cookies.has(Prismic.experimentCookie)) {
    return cookies.get(Prismic.experimentCookie);
  } else if (cookies.has(Prismic.previewCookie)) {
    return cookies.get(Prismic.previewCookie);
  }
  const api = await prismicClient.getApi();
  return api.masterRef.ref;
}

const getClient = async (repositoryName: string, accessToken: string): Promise<ApolloClient<any>> => {
  if (!client) {
    let repositoryName: string = '';
    if (typeof window !== 'undefined') {
      const registry = (window as any).___sourcePrismicGraphql;
      if (registry.repositoryName) {
        repositoryName = registry.repositoryName;
      }
    }
    const uri = `https://${repositoryName}.prismic.io/graphql`
    const cache = await buildCache(uri, repositoryName, accessToken)

    client = new ApolloClient({
      cache,
      link: PrismicLink({
        uri,
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
      const prismicInfos = (typeof window !== 'undefined') ? (window as any).___sourcePrismicGraphql : {}
      this.state = {
        // proxy data to state
        data: props.pageContext.data || null,
        loading: prismicInfos.previews && this.isPreviewMode(),
        error: null,
        prismicInfos
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
      const client = await getClient(this.state.prismicInfos.repositoryName, this.state.prismicInfos.accessToken);
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

      if(prismic.loading) return <PreviewLoader />
      if ((!ComposedComponent || !this.state.data)) {
        console.log("Component404")
        console.log(Component404)
        if(Component404 && (Component404 as any).default) {
          const NotFound = (Component404 as any).default
          return <NotFound />
        }
        else (window as any).location = '/404.html'; // return 404
      }
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
