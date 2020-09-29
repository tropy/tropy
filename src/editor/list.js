import {
  wrapInList,
  liftListItem,
  sinkListItem
} from 'prosemirror-schema-list'

export function list(schema) {
  return {
    ol: wrapInList(schema.nodes.ordered_list),
    ul: wrapInList(schema.nodes.bullet_list),
    liftListItem: liftListItem(schema.nodes.list_item),
    sinkListItem: sinkListItem(schema.nodes.list_item)
  }
}
