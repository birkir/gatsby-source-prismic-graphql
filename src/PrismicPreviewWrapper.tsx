import React from 'react';
import traverse from 'traverse';
import { get, isArray } from 'lodash';
import Prismic from 'prismic-javascript';

interface IProps {
  children: React.ReactElement<any>;
  repositoryName: string;
  path?: string;
  data?: any;
}

interface IState {
  data: any;
}

export default class PrismicPreviewWrapper extends React.Component<IProps, IState> {

  public state: IState = {
    data: this.props.data,
  };

  public url: URL = new URL(window.location.toString());
  public qs: URLSearchParams = this.url.searchParams;

  public componentDidMount(): void {
    this.setup();
  }

  public async setup(): Promise<void> {
    const documentId = this.qs.get('documentId');
    const targetId = this.qs.get('targetId');

    const data = { ...this.props.data };

    if (this.qs.has('preview')) {
      const prismicIds = traverse(data).reduce(function(acc: string[]) {
        if (this.key === 'prismicId' && this.parent && acc.indexOf(this.parent.node.prismicId) === -1) {
          acc.push(this.parent.node.prismicId);
        }
        return acc;
      }, []);

      if (prismicIds.indexOf(documentId) === -1) {
        prismicIds.push(documentId);
      }

      const api = await Prismic.getApi(`https://${this.props.repositoryName}.cdn.prismic.io/api/v2`);
      const previews = await Promise.all(prismicIds.map((prismicId: string) => api.getByID(prismicId)));

      // Update the object with a match from preview (if available)
      const updateWithPreview = (obj: any) => {
        const id = (obj.id === targetId) ? documentId : obj.id;
        const preview = previews.find((p: any) => p.id === id);

        return traverse(obj).map(function(x: any) {

          if (this.key === 'localFile') {
            // TODO: traverse all localfiles and replace sharp urls with the external prismic image
            this.remove();
          }

          if (this.key === 'dataString') {
            this.update(JSON.stringify((preview as any).data));
          }

          if (this.key === 'raw' && isArray(x)) {
            const paths = this.path.slice(0);
            paths.pop();
            this.update(get(preview, paths.join('.')), true);
          }

          if (this.isLeaf) {
            const previewValue = get(preview, this.path.join('.'));
            if (previewValue) {
              this.update(previewValue);
            }
          }
        });
      };

      // Traverse all objects that have `prismicId` in them
      traverse(data).forEach(function(x: any) {
        if (get(x, 'prismicId')) {
          this.update(updateWithPreview(x));
        }
      });

      this.setState({ data });
    }
  }

  render() {
    return React.cloneElement(this.props.children, {
      data: this.state.data,
    });
  }
}
