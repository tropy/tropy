'use strict'

const { createSelector: memo } = require('reselect')
const { get } = require('../common/util')

const getEsperViewState = memo(
  ({ esper }) => esper.view,
  ({ nav }) => nav.photo,
  ({ nav }) => nav.selection,
  (view, photo, selection) =>
    get(view, [selection || photo]) || {}
)

module.exports = {
  getEsperViewState
}
