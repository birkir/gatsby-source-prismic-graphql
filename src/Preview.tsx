import React from 'react';
import { get } from 'lodash';
import Prismic from 'prismic-javascript';

export default class PreviewPage extends React.Component<any> {

  public url: URL = new URL('http://localhost');

  public componentDidMount() {
    this.url = new URL(window.location.toString());

    if (this.url.searchParams.has('token')) {
      this.preview();
    }
  }

  get repositoryName() {
    return this.props.pageContext.repositoryName;
  }

  get linkResolver() {
    return new Function(this.props.pageContext.linkResolver)();
  }

  public async preview() {
    const token = this.url.searchParams.get('token');
    const documentId = this.url.searchParams.get('documentId');

    if (!token || !documentId) return;

    const api = await Prismic.getApi(`https://${this.repositoryName}.cdn.prismic.io/api/v2`);
    await api.previewSession(token, this.linkResolver, '/');

    const now = new Date();
    now.setHours(now.getHours() + 1);
    document.cookie = `${Prismic.previewCookie}=${token}; expires=${now.toUTCString()}; path=/`;

    // Find published document
    let doc = await api.getByID(documentId, { ref: api.master() });

    if (!doc || (doc && !doc.first_publication_date)) {
      const { type } = await api.getByID(documentId);
      const latestOfPublishedType = await api.query(
        Prismic.Predicates.at('document.type', type),
        {
          orderings: '[document.first_publication_date desc]',
          pageSize: 1,
        },
      );

      if (latestOfPublishedType && latestOfPublishedType.results.length) {
        doc = get(latestOfPublishedType, 'results.0');
        if (doc) {
          this.url.searchParams.set('targetId', doc.id);
        }
      }
    }

    if (doc) {
      this.redirect(doc);
    } else {
      alert('Error: Did not find any published document of this type to use as a placeholder');
    }
  }

  public redirect(doc: any): void {
    const to = new URL(this.url.toString());
    const pathname = this.linkResolver(doc);
    to.pathname = pathname.replace(/\/*$/, '') + '/';
    to.searchParams.append('preview', 'true');
    (window as any).location = to;
  }

  public render(): null {
    return null;
  }
}
