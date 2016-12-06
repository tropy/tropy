'use strict'

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

const getTemplate = (state, props) =>
  T[props.template]
    .map(property => ({ property: state.properties[property] }))


module.exports = {
  getTemplate
}
