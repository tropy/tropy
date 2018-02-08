'use strict'

const {
  wrapInList,
  liftListItem,
  sinkListItem
} = require('prosemirror-schema-list')

module.exports = {
  list(schema) {
    return {
      ol: wrapInList(schema.nodes.ordered_list),
      ul: wrapInList(schema.nodes.bullet_list),
      liftListItem: liftListItem(schema.nodes.list_item),
      sinkListItem: sinkListItem(schema.nodes.list_item),
    }
  }
}
