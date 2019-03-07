import gql from 'graphql-tag'
import { DocumentMetadata } from '../models/DocumentMetadata'
import { QueryStorage } from '../models/QueryStorage';
import { parse, print, DefinitionNode, OperationDefinitionNode, SelectionSetNode, FieldNode, SelectionNode, DocumentNode, ArgumentNode } from 'graphql'

export default { buildQuery, convertToGraphQL }

const uidTag = '{{uid}}'
const langTag = '{{lang}}'

function findNodeByNameInSelection(selectionSet: SelectionSetNode, nodeName: string): any {
  return selectionSet.selections.filter((selection: any) => {
    if(selection.kind === 'Field' && selection.name && selection.name.value === nodeName) return selection
    else return null
  })[0]
}

function updateSelectionSet(selectionSet: SelectionSetNode, updatedSelection: any): SelectionSetNode {
  const selections = selectionSet.selections.map((selection: any) => {
    return Object.assign({}, selection, updatedSelection)
  })

  return Object.assign({}, selectionSet, {selections})
}

function extractQueryFromGatsbyNamespace(originalQuery: string): DocumentNode {
  const parsed = parse(originalQuery)

  const definitions = parsed.definitions.map((def: DefinitionNode) => {
    const prismicNode = findNodeByNameInSelection((def as OperationDefinitionNode).selectionSet, 'prismic')
    if(prismicNode) return Object.assign({}, def as any, { selectionSet: prismicNode.selectionSet})
    else return (def as any)
  })

  return Object.assign({}, parsed, { definitions }) as DocumentNode
}

function buildArgument(key: string, value: string): ArgumentNode {
  return {
    kind: 'Argument',
    name: {
      kind: 'Name',
      value: key
    },
    value: {
      kind: 'StringValue',
      value: value,
      block: false
    }
  } as ArgumentNode
}
function buildQueryByUID(baseQuery: DocumentNode, hasLang?: boolean): DocumentNode {
  const definitions = baseQuery.definitions.map((def: DefinitionNode) => {
    const args = (() => {
      const base = [buildArgument('uid', uidTag)]
      if(hasLang) return base.concat([buildArgument('lang', langTag)])
      else return base
    })()

    // querySelection.selectionSet.map((s: any) => console.log(s))
    return updateSelectionSet((def as OperationDefinitionNode).selectionSet, { arguments: args })
  })
  return Object.assign({}, baseQuery, { definitions }) as DocumentNode
}

function buildQuery(docMeta: DocumentMetadata, queryStorage: QueryStorage): string | null {
  if(!queryStorage.query) return null

  const baseQuery: DocumentNode = extractQueryFromGatsbyNamespace(queryStorage.query)
  const finalQuery = (() => {
    if(docMeta.uid) {
      return buildQueryByUID(baseQuery)
    } else {
      return baseQuery
    }
  })()
  //need to return query as string for future interpolation for unpublished doc
  return print(finalQuery)
}

function convertToGraphQL(strQuery: String, docMeta: DocumentMetadata) {

  const interpolatedQuery = (() => {
    const withUID = docMeta.uid ? strQuery.replace(uidTag, docMeta.uid) : strQuery
    return docMeta.lang ? withUID.replace(langTag, docMeta.lang) : withUID
  })()

  return gql(interpolatedQuery)
}