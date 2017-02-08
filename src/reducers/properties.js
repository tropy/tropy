'use strict'

const { PROPERTIES } = require('../constants')
const { DC } = PROPERTIES

const init = {
  [DC.CONTRIBUTOR]: {
    uri: DC.CONTRIBUTOR,
    label: 'Contributor',
    definition: 'An entity responsible for making contributions to the resource.',
    comment: 'Examples of a Contributor include a person, an organization, or a service. Typically, the name of a Contributor should be used to indicate the entity.'
  },

  [DC.COVERAGE]: { uri: DC.COVERAGE, label: 'Coverage', },
  [DC.CREATOR]: { uri: DC.CREATOR, label: 'Creator', },
  [DC.DATE]: {
    uri: DC.DATE,
    label: 'Date',
    type: 'date',
    definition: 'A point or period of time associated with an event in the lifecycle of the resource.',
    comment: 'Date may be used to express temporal information at any level of granularity. Recommended best practice is to use an encoding scheme, such as the W3CDTF profile of ISO 8601 [W3CDTF].'
  },
  [DC.DESCRIPTION]: { uri: DC.DESCRIPTION, label: 'Description', },
  [DC.FORMAT]: { uri: DC.FORMAT, label: 'Format', },
  [DC.IDENTIFIER]: { uri: DC.IDENTIFIER, label: 'Identifier' },
  [DC.LANGUAGE]: { uri: DC.LANGUAGE, label: 'language', },
  [DC.PUBLISHER]: { uri: DC.PUBLISHER, label: 'Publisher' },
  [DC.RELATION]: { uri: DC.RELATION, label: 'Relation' },
  [DC.RIGHTS]: { uri: DC.RIGHTS, label: 'Rights' },
  [DC.SOURCE]: { uri: DC.SOURCE, label: 'Source' },
  [DC.SUBJECT]: { uri: DC.SUBJECT, label: 'Subject' },
  [DC.TITLE]: {
    uri: DC.TITLE,
    label: 'Title',
    definition: 'A name given to the resource.'
  },
  [DC.TYPE]: { uri: DC.TYPE, label: 'Type' }
}

module.exports = {
  properties(state = init, { type, payload }) {
    switch (type) {
      case PROPERTIES.RESTORE:
        return { ...init }

      case PROPERTIES.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
