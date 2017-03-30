'use strict'

const { createSelector: memo } = require('reselect')
const { values } = Object
const { seq, compose, filter, map, cat, keep } = require('transducers.js')
const { getSelectedItems } = require('./items')

const getTags = ({ tags }) => tags

const visible = (tag) => tag.visible
const byName = (a, b) => a.name < b.name ? -1 : 1


const getAllTags = memo(
  getTags,
  (tags) => values(tags).filter(visible).sort(byName)
)

const getVisibleTags = memo(
  getTags,
  getSelectedItems,

  (tags, items) => seq(
    items,
    compose(
      map(item => item.tags),
      cat,
      map(id => tags[id]),
      keep(),
      filter(visible)
    )).sort(byName)
)


module.exports = {
  getAllTags,
  getVisibleTags
}
