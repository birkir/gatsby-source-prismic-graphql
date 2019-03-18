import { Data, PageOptions } from '../models/PageOptions'
import { DocumentMetadata } from '../models/DocumentMetadata'

export default {
  buildMetadata(data: Data) {
    return {
      uid: data._meta && data._meta.uid
    } as DocumentMetadata
  }
}
