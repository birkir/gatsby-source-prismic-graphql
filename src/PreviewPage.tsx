import React from 'react';
import Prismic from 'prismic-javascript';
import { qs, linkResolver, componentResolver, getCookies } from './utils';
import { withPreview } from './withPreview';

interface IVariation {
  id: string;
  label: string;
  ref: string;
};

export class PreviewPage extends React.Component<any> {

  public url: URL | undefined;
  public qs = new Map();

  public state = {
    component: null
  };

  public componentDidMount() {
    this.setup();
  }

  setup() {
    if (typeof window !== 'undefined') {
      this.url = new URL(window.location.toString());
      this.qs = qs(String(this.url.search).substr(1));
      this.preview();
    }
  }

  get config() {
    if (typeof window !== 'undefined') {
      const config = (window as any).___sourcePrismicGraphql;
      return config || {};
    }
    return {};
  }

  public async preview() {
    const token = this.qs.get('token');
    const experiment = this.qs.get('experiment');
    const documentId = this.qs.get('documentId');

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

    const link = linkResolver(doc);
    const exists = await fetch(link).then(res => res.status) === 200;

    if (exists) {
      (window as any).location = link;
      return;
    }

    if (typeof componentResolver === 'function') {
      this.setState({
        component: componentResolver(doc)
      });
      window.history.replaceState({}, 'prismic', window.location.pathname + '?documentId=' + doc.id);
    }
  }

  public render() {
    if (this.state.component) {
      const component = (this.state.component as any).default || this.state.component;
      if (component.query) {
        return React.createElement(withPreview(component, component.query));
      }
      return React.createElement(component);
    }
    return null;
  }
}

export default PreviewPage;
