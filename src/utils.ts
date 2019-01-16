import Prismic from 'prismic-javascript';
import { HttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { HttpOptions } from 'apollo-link-http-common';

interface IPrismicLinkArgs extends HttpOptions {
  uri: string;
  accessToken?: string;
  useGETForQueries?: boolean;
}

// @todo should this be configurable?
export const fieldName = 'prismic';
export const typeName = 'PRISMIC';

// keep link resolver function
export let linkResolver: (doc: any) => string;
export let componentResolver: (doc: any) => React.Component;

export function qs(qs: string = '', delimiter: string = '&'): Map<string, string> {
  return new Map(
    qs.split(delimiter).map((item) => {
      const [key, value] = item.split('=').map((part) => decodeURIComponent(part.trim()))
      return [key, value] as [string, string];
    })
  );
}

export function registerResolvers(link: typeof linkResolver, component?: typeof componentResolver) {
  linkResolver = link;
  if (component) {
    componentResolver = component;
  }
}

export function getCookies() {
  return qs(document.cookie, ';');
}

/**
 * Apollo Link for Prismic
 * @param options Options
 */
export function PrismicLink({ uri, accessToken, ...rest }: IPrismicLinkArgs) {
  const BaseURIReg = /^(https?:\/\/.+?\..+?\..+?)\/graphql\/?$/;
  const matches = uri.match(BaseURIReg);
  if (matches && matches[1]) {
    const prismicClient = Prismic.client(`${matches[1]}/api`, { accessToken });
    const prismicLink = setContext(
      async (request, options: { headers: { [key: string]: string; } }) => {
        let prismicRef;
        if (typeof window !== 'undefined' && document.cookie) {
          const cookies = getCookies();
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
