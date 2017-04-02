'use strict'

const { createSelector: memo } = require('reselect')
const { values } = Object
const { getSelectedItems } = require('./items')
const { seq, compose, filter, map, cat, keep } = require('transducers.js')

const getTags = ({ tags }) => tags

const visible = (tag) => tag.visible
const byName = (a, b) => a.name < b.name ? -1 : 1


const getAllTags = memo(
  getTags,
  (tags) => values(tags).filter(visible).sort(byName)
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
        filter(visible),
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
