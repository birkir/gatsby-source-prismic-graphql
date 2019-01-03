import React from 'react';
import Prismic from 'prismic-javascript';
import { parseQuery } from './utils';

interface IVariation {
  id: string;
  label: string;
  ref: string;
};

export class PreviewPage extends React.Component<any> {

  public url: URL | undefined;
  public qs = new Map();

  public componentDidMount() {
    this.setup();
  }

  setup() {
    if (typeof window !== 'undefined') {
      this.url = new URL(window.location.toString());
      this.qs = parseQuery(String(this.url.search).substr(1));
      this.preview();
    }
  }

  get config() {
    if (typeof window === 'undefined') {
      const config = (window as any).___sourcePrismicGraphql;
      return config || {};
    }
    return {};
  }

  get repositoryName() {
    return this.props.pageContext.repositoryName || this.config.repositoryName;
  }

  get linkResolver() {
    try {
      const linkResolver = this.props.linkResolver || this.props.pageContext.linkResolver || this.config.linkResolver;
      const resolver = new Function(`return ${linkResolver}`)();
      resolver(null);
      return resolver;
    } catch (err) {
      return () => '/';
    }
  }

  public async preview() {
    const experiment = this.qs.get('experiment');
    const token = this.qs.get('token');
    const documentId = this.qs.get('documentId');

    const now = new Date();
    now.setHours(now.getHours() + 1);

    const api = await Prismic.getApi(`https://${this.repositoryName}.cdn.prismic.io/api/v2`);

    if (token) {
      await api.previewSession(token, this.linkResolver, '/');
      document.cookie = `${Prismic.previewCookie}=${token}; expires=${now.toUTCString()}; path=/`;

      if (!documentId) {
        return this.redirect();
      }

      const doc = await api.getByID(documentId);

      return this.redirect(doc);
    } else if (experiment) {
      const runningVariations: IVariation[] = [];

      if (api.experiments.running && api.experiments.running.length) {
        runningVariations.concat(...api.experiments.running.map(experiment => experiment.data.variations));
      }

      if (experiment && runningVariations.length) {
        const matchedVariation = runningVariations
          .find(variation => variation.label.toLowerCase().replace(' ', '-') === experiment);

        if (matchedVariation) {
          document.cookie = `${Prismic.experimentCookie}=${matchedVariation.ref}; expires=${now.toUTCString()}; path=/`;
          this.redirect();
        }
      }
    }
  }

  public redirect = (doc?: any): void => {
    const to = new URL(this.url && this.url.toString() || '');
    const pathname = doc ? this.linkResolver(doc) : '/';
    to.pathname = pathname.replace(/\/*$/, '') + '/';
    to.search = '';
    (window as any).location = to;
  }

  public render() {
    return null;
  }
}

export default PreviewPage;
