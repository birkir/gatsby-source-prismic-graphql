import { PreviewCookie as CookieModel } from '../interfaces/PreviewCookie';
import { getCookies } from '../utils';
import Prismic from 'prismic-javascript';

export const Endpoints = {
  DEFAULT_DOMAIN: 'prismic.io',

  regexp: /^((https?):\/\/)?([-a-zA-Z0-9_]+)([.]cdn)?[.]?((prismic|wroom)\.(io|test|dev))?/,

  _parse(repositoryName: string): { isSecuredScheme: boolean; subdomain: string; domain: string } {
    const result = repositoryName.match(this.regexp);
    if (result) {
      const subdomain = result[3];
      const domain = result[5];
      const isSecuredScheme =
        Boolean(result[2] && result[2] === 'https') ||
        !domain ||
        domain === this.DEFAULT_DOMAIN ||
        domain === 'wroom.io';

      return { isSecuredScheme, subdomain, domain: domain || this.DEFAULT_DOMAIN };
    } else throw `Invalid Prismic repository name provided: ${repositoryName}`;
  },

  domain(repositoryName: string): string {
    const { subdomain, domain } = this._parse(repositoryName);
    return `${subdomain}.${domain}`;
  },

  root(repositoryName: string, withCDN: boolean = true): string {
    const { isSecuredScheme, subdomain, domain } = this._parse(repositoryName);
    const scheme = isSecuredScheme ? 'https' : 'http';
    const cdn = isSecuredScheme && withCDN ? '.cdn' : '';
    return `${scheme}://${subdomain}${cdn}.${domain}`;
  },

  graphql(repositoryName: string): string {
    return this.root(repositoryName, false) + '/graphql';
  },

  v2(repositoryName: string): string {
    return this.root(repositoryName) + '/api/v2';
  },
};

export const PreviewCookie = {
  get(repositoryName: string): CookieModel | undefined {
    const cookies = getCookies();
    const cookieValue = cookies.get(Prismic.previewCookie);
    if (!cookieValue) return;
    try {
      return JSON.parse(cookieValue);
    } catch (e) {
      // legacy cookie format
      return {
        [Endpoints.domain(repositoryName)]: {
          preview: cookieValue,
        },
      };
    }
  },

  ref(repositoryName: string): string | undefined {
    const cookie = this.get(repositoryName);
    if (cookie)
      return (
        cookie[Endpoints.domain(repositoryName)] && cookie[Endpoints.domain(repositoryName)].preview
      );
    else return;
  },
};

export const EditButton = {
  HEADER_NAME: 'prismic-editbutton-url',
};
