import Prismic from 'prismic-javascript';
import { HttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { HttpOptions } from 'apollo-link-http-common';

interface IPrismicLinkArgs extends HttpOptions {
  uri: string;
  accessToken?: string;
  useGETForQueries?: boolean;
}

export function PrismicLink({ uri, accessToken, ...rest }: IPrismicLinkArgs) {
  const BaseURIReg = /^(https?:\/\/.+?\..+?\..+?)\/graphql\/?$/;
  const matches = uri.match(BaseURIReg);
  if (matches && matches[1]) {
    const prismicClient = Prismic.client(`${matches[1]}/api`, { accessToken });
    const prismicLink = setContext(
      async (request, options: { headers: { [key: string]: string; } }) => {
        let prismicRef;
        if (typeof window !== 'undefined' && document.cookie) {
          const cookies = new Map(document.cookie.split(';').map(n => n.split('=').map(n => decodeURIComponent(n.trim())).slice(0, 2) as [string, string]));
          if (cookies.has(Prismic.experimentCookie)) {
            prismicRef = cookies.get(Prismic.experimentCookie);
          } else if (cookies.has(Prismic.previewCookie)) {
            prismicRef = cookies.get(Prismic.previewCookie);
          }
        }
        if (!prismicRef) {
          const api = await prismicClient.getApi();
          prismicRef = api.masterRef.ref;
        }
        const authorizationHeader = accessToken ? { Authorization: `Token ${accessToken}` } : {};
        return {
          headers: {
            ...options.headers,
            ...authorizationHeader,
            'Prismic-ref': prismicRef
          }
        }
      }
    );

    const httpLink = new HttpLink({
      uri,
      useGETForQueries: true,
      ...rest,
    });

    return prismicLink.concat(httpLink);
  } else {
    throw new Error(`${uri} isn't a valid Prismic GraphQL endpoint`)
  }
}
