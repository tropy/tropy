'use strict'

const {
  createSelector: memo
} = require('reselect')

const { DC } = require('../constants/properties')

const T = {
  core: [
    DC.TYPE,
    DC.TITLE,
    DC.DESCRIPTION,
    DC.DATE,
    DC.CREATOR,
    DC.PUBLISHER,
    DC.SOURCE,
    DC.RIGHTS
  ],

  photo: [
    DC.TITLE,
    DC.DATE
  ]
}

const getTemplates = memo(
  () => T,
  ({ properties }) => properties,

  (templates, properties) =>
    Object
      .entries(templates)
      .reduce((t, [k, v]) => (
        (t[k] = v.map(p => ({ property: properties[p] }))), t
      ), {}))

const getTemplate = (state, props) =>
  T[props.template]
    .map(property => ({ property: state.properties[property] }))


module.exports = {
  getTemplates,
  getTemplate
}
