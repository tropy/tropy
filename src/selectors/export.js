'use strict'

const { createSelector: memo } = require('reselect')
const { pick, groupBy } = require('../common/util')
const { values, entries } = Object

const getGroupedItems = (ids) => memo(
  ({ items }) => pick(items, ids),
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.template,
  ({ metadata }) => metadata,
  ({ photos }) => photos,
  ({ lists }) => lists,
  ({ tags }) => tags,
  ({ notes }) => notes,
  ({ selections }) => selections,
  (items, props, templates,
   metadata, photos, lists, tags, notes, selections) => {
    return [
      entries(groupBy(values(items), 'template')).reduce((res, [t, items]) => {
        res[t] = {
          template: templates[t] || { id: t },
          items
        }
        return res
      }, {}),
      props,
      metadata,
      photos,
      lists,
      tags,
      notes,
      selections
    ]
  }
)


const getExportableItems = memo(
  ({ nav, qr }) => (nav.items.length > 0 ? nav.items : qr.items),
  ({ items }) => items,
  ({ photos }) => photos,
  ({ selections }) => selections,
  ({ metadata }) => metadata,
  ({ notes }) => notes,
  ({ notepad }) => notepad,
  ({ tags }) => tags,
  ({ ontology }) => ontology,
  (ids, items, photos, selections, metadata, notes, notepad, tags, ontology) =>
  ids.map(id =>
    getItemExpanded(items[id],
      photos,
      selections,
      metadata,
      notes,
      notepad,
      tags,
      ontology))
)

module.exports = {
  getGroupedItems,
  getExportableItems
}
