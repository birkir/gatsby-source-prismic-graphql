import React from 'react';
import Prismic from 'prismic-javascript';
import { pathToRegexp, Key } from 'path-to-regexp';
import { linkResolver, getCookies, getPagePreviewPath } from '../utils';
import { parseQueryString } from '../utils/parseQueryString';
import { Page } from '../interfaces/PluginOptions';

interface Variation {
  id: string;
  label: string;
  ref: string;
}

export default class PreviewPage extends React.Component<any> {
  public componentDidMount() {
    this.preview();
  }

  get config() {
    return this.props.prismic.options;
  }

  public async preview() {
    const { location } = this.props;
    const qs = parseQueryString(String(location.search).substr(1));
    const token = qs.get('token');
    const experiment = qs.get('experiment');
    const documentId = qs.get('documentId');

    // Expiration date of cookie
    const now = new Date();
    now.setHours(now.getHours() + 1);

    const api = await Prismic.getApi(`https://${this.config.repositoryName}.cdn.prismic.io/api/v2`);

    if (token) {
      await api.previewSession(token, linkResolver, '/');
      document.cookie = `${Prismic.previewCookie}=${token}; expires=${now.toUTCString()}; path=/`;

      if (!documentId) {
        return this.redirect();
      }

      const doc = await api.getByID(documentId);

      return this.redirect(doc);
    } else if (experiment) {
      const runningVariations: Variation[] = [];

      if (api.experiments.running && api.experiments.running.length) {
        runningVariations.concat(
          ...api.experiments.running.map(experiment => experiment.data.variations)
        );
      }

      if (experiment && runningVariations.length) {
        const matchedVariation = runningVariations.find(
          variation => variation.label.toLowerCase().replace(' ', '-') === experiment
        );

        if (matchedVariation) {
          document.cookie = `${Prismic.experimentCookie}=${
            matchedVariation.ref
          }; expires=${now.toUTCString()}; path=/`;
          this.redirect();
        }
      }
    } else if (documentId) {
      const cookies = getCookies();
      const doc = await api.getByID(documentId);
      const preview = cookies.has(Prismic.previewCookie) || cookies.has(Prismic.experimentCookie);
      this.redirect(preview && doc);
    }
  }

  public redirect = async (doc?: any) => {
    if (!doc) {
      (window as any).location = '/';
      return;
    }

    const link: string = linkResolver(doc);

    const pathWithQS = (this.config.pages || [])
      .map((page: Page) => {
        const keys: Key[] = [];
        const re: RegExp = pathToRegexp(page.match, keys);
        const match = re.exec(link);
        const delimiter = (str: string) => (str.indexOf('?') === -1 ? '?' : '&');
        if (match) {
          return match.slice(1).reduce((acc: string, value: string, i: number) => {
            if (keys[i] && value !== undefined)
              return acc + `${delimiter(acc)}${keys[i].name}=${value}`;
            else return acc;
          }, getPagePreviewPath(page));
        }
        return null;
      })
      .find((n: any) => !!n);

    const pageExists = this.props.pageContext.prismicAllPagePaths.indexOf(link) !== -1;

    if (!pageExists && pathWithQS) {
      const newUrl = `${window.location.protocol}//${window.location.host}${pathWithQS}`;
      window.location.replace(newUrl);
    } else {
      window.location.replace(link as any);
    }
  };

  public render() {
    return null;
  }
}
