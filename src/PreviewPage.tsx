import React from 'react';
import Prismic from 'prismic-javascript';
import { parseQuery } from './utils';

export class PreviewPage extends React.Component<any> {

  public url: URL | undefined;
  public qs = new Map();

  public componentDidMount() {
    this.setup();
  }

  setup() {
    if (typeof window !== 'undefined') {
      this.url = new URL(window.location.toString());
      this.qs = parseQuery(this.url.search);
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
    if (this.props.pageContext.repositoryName) {
      return ;
    }
    return this.props.pageContext.repositoryName || this.config.repositoryName;
  }

  get linkResolver() {
    try {
      const linkResolver = this.props.pageContext.linkResolver || this.config.linkResolver;
      const resolver = new Function(`return ${linkResolver}`)();
      resolver(null);
      return resolver;
    } catch (err) {
      return () => '/';
    }
  }

  public async preview() {
    const token = this.qs.get('token');
    const documentId = this.qs.get('documentId');

    if (!token) return;

    const api = await Prismic.getApi(`https://${this.repositoryName}.cdn.prismic.io/api/v2`);
    await api.previewSession(token, this.linkResolver, '/');

    const now = new Date();
    now.setHours(now.getHours() + 1);
    document.cookie = `${Prismic.previewCookie}=${token}; expires=${now.toUTCString()}; path=/`;

    // @todo support experiments

    if (!documentId) {
      return this.redirect(null);
    }

    const doc = await api.getByID(documentId);
    return this.redirect(doc);

  //   // Find published document
  //   let doc = await api.getByID(documentId, { ref: api.master() });

  //   if (!doc || (doc && !doc.first_publication_date)) {
  //     const { type } = await api.getByID(documentId);
  //     const latestOfPublishedType = await api.query(
  //       Prismic.Predicates.at('document.type', type),
  //       {
  //         orderings: '[document.first_publication_date desc]',
  //         pageSize: 1,
  //       },
  //     );

  //     if (latestOfPublishedType && latestOfPublishedType.results.length) {
  //       doc = get(latestOfPublishedType, 'results.0');
  //       if (doc) {
  //         this.url.searchParams.set('targetId', doc.id);
  //       }
  //     }
  //   }

  //   if (doc) {
  //     this.redirect(doc);
  //   } else {
  //     alert('Error: Did not find any published document of this type to use as a placeholder');
  //   }
  }

  public redirect = (doc: any): void => {
    const to = new URL(this.url && this.url.toString() || '');
    const pathname = this.linkResolver(doc);
    to.pathname = pathname.replace(/\/*$/, '') + '/';
    (window as any).location = to;
  }

  public render() {
    return null;
  }
}

export default PreviewPage;
