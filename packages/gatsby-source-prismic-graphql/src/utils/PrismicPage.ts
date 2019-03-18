import { Data } from '../interfaces/PageOptions';
import { DocumentMetadata } from '../interfaces/DocumentMetadata';

export default {
  buildMetadata(data: Data) {
    return {
      uid: data._meta && data._meta.uid,
    } as DocumentMetadata;
  },
};
