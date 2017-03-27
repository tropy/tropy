'use strict'

const { createSelector: memo } = require('reselect')
const { pluck } = require('./util')

const getMetadata = ({ metadata }) => metadata

const getSelectedMetadata = memo(
  getMetadata, ({ nav }) => (nav.items), pluck
)

const getVisibleMetadata = memo(
  ({ items }) => items, ({ qr }) => (qr.items), pluck
)

module.exports = {
  getSelectedMetadata,
  getVisibleMetadata
}
