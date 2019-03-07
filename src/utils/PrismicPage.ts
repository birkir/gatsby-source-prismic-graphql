import { Data, PageOptions } from 'gatsby-source-prismic-graphql/src/models/PageOptions'
import { DocumentMetadata } from 'gatsby-source-prismic-graphql/src/models/DocumentMetadata'

export default {
  buildMetadata(data: Data) {
    return {
      uid: data._meta && data._meta.uid
    } as DocumentMetadata
  }
}
