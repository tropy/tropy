'use strict'

const { PROPERTIES } = require('../constants')

const init = {
  'http://purl.org/dc/elements/1.1/contributor': {
    uri: 'http://purl.org/dc/elements/1.1/contributor',
    label: 'Contributor',
    definition: 'An entity responsible for making contributions to the resource.',
    comment: 'Examples of a Contributor include a person, an organization, or a service. Typically, the name of a Contributor should be used to indicate the entity.'
  },
  'http://purl.org/dc/elements/1.1/coverage': {
    uri: 'http://purl.org/dc/elements/1.1/coverage',
    label: 'Coverage'
  },
  'http://purl.org/dc/elements/1.1/creator': {
    uri: 'http://purl.org/dc/elements/1.1/creator',
    label: 'Creator'
  },
  'http://purl.org/dc/elements/1.1/date': {
    uri: 'http://purl.org/dc/elements/1.1/date',
    label: 'Date'
  },
  'http://purl.org/dc/elements/1.1/description': {
    uri: 'http://purl.org/dc/elements/1.1/description',
    label: 'Description'
  },
  'http://purl.org/dc/elements/1.1/format': {
    uri: 'http://purl.org/dc/elements/1.1/format',
    label: 'Format'
  },
  'http://purl.org/dc/elements/1.1/identifier': {
    uri: 'http://purl.org/dc/elements/1.1/identifier',
    label: 'Identifier'
  },
  'http://purl.org/dc/elements/1.1/language': {
    uri: 'http://purl.org/dc/elements/1.1/language',
    label: 'language'
  },
  'http://purl.org/dc/elements/1.1/publisher': {
    uri: 'http://purl.org/dc/elements/1.1/publisher',
    label: 'Publisher'
  },
  'http://purl.org/dc/elements/1.1/relation': {
    uri: 'http://purl.org/dc/elements/1.1/relation',
    label: 'Relation'
  },
  'http://purl.org/dc/elements/1.1/Rights': {
    uri: 'http://purl.org/dc/elements/1.1/rights',
    label: 'Rights'
  },
  'http://purl.org/dc/elements/1.1/source': {
    uri: 'http://purl.org/dc/elements/1.1/source',
    label: 'Source'
  },
  'http://purl.org/dc/elements/1.1/subject': {
    uri: 'http://purl.org/dc/elements/1.1/subject',
    label: 'Subject'
  },
  'http://purl.org/dc/elements/1.1/title': {
    uri: 'http://purl.org/dc/elements/1.1/title',
    label: 'Title'
  },
  'http://purl.org/dc/elements/1.1/type': {
    uri: 'http://purl.org/dc/elements/1.1/type',
    label: 'Type'
  }
}

module.exports = {
  properties(state = init, { type, payload }) {
    switch (type) {
      case PROPERTIES.RESTORE:
        return { ...init, ...payload }

      case PROPERTIES.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
