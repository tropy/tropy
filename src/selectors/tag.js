'use strict'

const values = require('object.values')

const {
  createSelector: memo
} = require('reselect')

const tag = ({ tags }, { tag }) => tags[tag]

const visible = memo(
  ({ tags }) => tags,

  (tags) =>
    values(tags)
      .filter(tag => tag.visible)
      .sort((a, b) => a.name < b.name ? -1 : 1)
 )


module.exports = {
  tag,
  visible
}
