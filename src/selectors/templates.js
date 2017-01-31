'use strict'

const {
  createSelector: memo
} = require('reselect')

const { entries } = Object
const { DC } = require('../constants/properties')

const CORE = 'https://schema.tropy.org/v1/templates/core'
const FULL = 'https://schema.tropy.org/v1/templates/full'
const PHOTO = 'https://schema.tropy.org/v1/templates/photo'

const T = {
  [CORE]: {
    uri: CORE,
    name: 'Core Item',
    type: 'item',
    fields: [
      DC.TYPE,
      DC.TITLE,
      DC.DATE,
      DC.DESCRIPTION
    ],
  },

  [FULL]: {
    uri: FULL,
    name: 'Expanded Item',
    type: 'item',
    fields: [
      DC.TYPE,
      DC.TITLE,
      DC.DESCRIPTION,
      DC.DATE,
      DC.CREATOR,
      DC.PUBLISHER,
      DC.SOURCE,
      DC.RIGHTS
    ],
  },

  [PHOTO]: {
    uri: PHOTO,
    name: 'Tropy Photo',
    type: 'photo',
    fields: [
      DC.TITLE,
      DC.DATE
    ]
  }
}

const getTemplates = memo(
  () => T,
  ({ properties }) => properties,

  (templates, properties) =>
    entries(templates)
      .reduce((tpl, [k, v]) => {
        tpl[k] = {
          ...v,
          fields: v.fields.map(p => ({ property: properties[p] }))
        }

        return tpl

      }, {}))


module.exports = {
  getTemplates
}
