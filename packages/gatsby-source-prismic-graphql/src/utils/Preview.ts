import gql from 'graphql-tag';
import traverse from 'traverse';
import { DocumentMetadata } from '../interfaces/DocumentMetadata';
import { QueryStorage } from '../interfaces/QueryStorage';
import {
  parse,
  print,
  DefinitionNode,
  OperationDefinitionNode,
  SelectionSetNode,
  FieldNode,
  SelectionNode,
  DocumentNode,
  ArgumentNode,
} from 'graphql';

export default { buildQuery, convertToGraphQL };

const uidTag = '{{uid}}';
const langTag = '{{lang}}';

function findNodeByNameInSelection(selectionSet: SelectionSetNode, nodeName: string): any {
  return selectionSet.selections.filter((selection: any) => {
    if (selection.kind === 'Field' && selection.name && selection.name.value === nodeName)
      return selection;
    else return null;
  })[0];
}

function updateSelectionSet(
  selectionSet: SelectionSetNode,
  updatedSelection: any
): SelectionSetNode {
  const selections = selectionSet.selections.map((selection: any) => {
    return Object.assign({}, selection, updatedSelection);
  });

  return Object.assign({}, selectionSet, { selections });
}

function extractQueryFromGatsbyNamespace(originalQuery: string): DocumentNode {
  const parsed = parse(originalQuery);

  const definitions = parsed.definitions.map((def: DefinitionNode) => {
    const prismicNode = findNodeByNameInSelection(
      (def as OperationDefinitionNode).selectionSet,
      'prismic'
    );
    if (prismicNode)
      return Object.assign({}, def as any, { selectionSet: prismicNode.selectionSet });
    else return def as any;
  });

  return Object.assign({}, parsed, { definitions }) as DocumentNode;
}

function buildArgument(key: string, value: string): ArgumentNode {
  return {
    kind: 'Argument',
    name: {
      kind: 'Name',
      value: key,
    },
    value: {
      kind: 'StringValue',
      value: value,
      block: false,
    },
  } as ArgumentNode;
}
function buildQueryByUID(baseQuery: DocumentNode, hasLang?: boolean): DocumentNode {
  const definitions = baseQuery.definitions.map((def: DefinitionNode, index: number) => {
    // we only update the first definition which is supposed to be the main document.
    if (index === 0) {
      const args = (() => {
        const base = [buildArgument('uid', uidTag)];
        if (hasLang) return base.concat([buildArgument('lang', langTag)]);
        else return base;
      })();

      // querySelection.selectionSet.map((s: any) => console.log(s))
      return updateSelectionSet((def as OperationDefinitionNode).selectionSet, { arguments: args });
    } else return def;
  });
  return Object.assign({}, baseQuery, { definitions }) as DocumentNode;
}

function stripeGatsbyPrefixes(query: DocumentNode, typeName: string) {
  return traverse(query).forEach(function(x) {
    if (this.isLeaf && this.parent && this.parent.key === 'name') {
      if (this.parent.parent && this.parent.parent.node.kind === 'NamedType') {
        if (typeof x === 'string' && x.indexOf(`${typeName}_`) === 0) {
          this.update(x.substr(typeName.length + 1));
        }
      }
    }
  });
}
function buildQuery(docMeta: DocumentMetadata, queryStorage: QueryStorage): string | null {
  if (!queryStorage.query) return null;

  const baseQuery: DocumentNode = extractQueryFromGatsbyNamespace(queryStorage.query);
  const withUIDQuery = (() => {
    if (docMeta.uid) {
      return buildQueryByUID(baseQuery);
    } else {
      return baseQuery;
    }
  })();
  const previewQuery = stripeGatsbyPrefixes(withUIDQuery, 'PRISMIC');
  //need to return query as string for future interpolation for unpublished doc
  return print(previewQuery);
}

function convertToGraphQL(strQuery: String, docMeta: DocumentMetadata) {
  const interpolatedQuery = (() => {
    const withUID = docMeta.uid ? strQuery.replace(uidTag, docMeta.uid) : strQuery;
    return docMeta.lang ? withUID.replace(langTag, docMeta.lang) : withUID;
  })();

  return gql(interpolatedQuery);
}
