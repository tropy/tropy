'use strict'

const { BLANK, get } = require('../common/util')

const getEsperViewState = ({ esper, nav }) =>
  get(esper.view, [nav.selection ?? nav.photo], BLANK)

module.exports = {
  getEsperViewState
}
