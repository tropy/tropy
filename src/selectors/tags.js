'use strict'

const { createSelector: memo } = require('reselect')
const { values } = Object
const { getSelectedItems } = require('./items')
const { seq, compose, filter, map, cat, keep } = require('transducers.js')

const coll = new Intl.Collator(ARGS.locale, { numeric: true })

const getTags = ({ tags }) => tags
const byName = (a, b) => coll.compare(a.name, b.name)

const getAllTags = memo(
  getTags,
  (tags) => values(tags).sort(byName)
)

const getItemTags = memo(
  getTags,
  getSelectedItems,

  (tags, items) => {
    const counts = {}

    return seq(items, compose(
        map(item => item.tags),
        cat,
        map(id => ((counts[id] = (counts[id] || 0) + 1), tags[id])),
        keep(),
        filter(tag => counts[tag.id] === 1)
      ))
      .map(tag => ({
        ...tag,
        count: counts[tag.id],
        mixed: counts[tag.id] < items.length
      }))
      .sort(byName)
  }
)


module.exports = {
  getAllTags,
  getItemTags
}
