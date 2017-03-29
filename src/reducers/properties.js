'use strict'

const { PROPERTIES } = require('../constants')
const { DC, TR, S } = PROPERTIES

const init = {
  [TR.BOX]: {
    uri: TR.BOX,
    label: 'Box',
    definition: 'A unit of archival organization.',
    comment: ''
  },
  [TR.FOLDER]: {
    uri: TR.FOLDER,
    label: 'Folder',
    definition: 'A unit of archival organization, usually within a box.',
    comment: ''
  },

  [DC.CONTRIBUTOR]: {
    uri: DC.CONTRIBUTOR,
    label: 'Contributor',
    definition: 'An entity responsible for making contributions to the resource.',
    comment: 'Examples of a Contributor include a person, an organization, or a service. Typically, the name of a Contributor should be used to indicate the entity.'
  },

  [DC.COVERAGE]: {
    uri: DC.COVERAGE,
    label: 'Coverage',
    definition: 'The spatial or temporal topic of the resource, the spatial applicability of the resource, or the jurisdiction under which the resource is relevant.',
    comment: 'Spatial topic and spatial applicability may be a named place or a location specified by its geographic coordinates. Temporal topic may be a named period, date, or date range. A jurisdiction may be a named administrative entity or a geographic place to which the resource applies. Recommended best practice is to use a controlled vocabulary such as the Thesaurus of Geographic Names [TGN]. Where appropriate, named places or time periods can be used in preference to numeric identifiers such as sets of coordinates or date ranges.'
  },
  [DC.CREATOR]: {
    uri: DC.CREATOR,
    label: 'Creator',
    definition: 'An entity primarily responsible for making the resource.',
    comment: 'Examples of a Creator include a person, an organization, or a service. Typically, the name of a Creator should be used to indicate the entity.'
  },
  [DC.DATE]: {
    uri: DC.DATE,
    label: 'Date',
    type: 'date',
    definition: 'A point or period of time associated with an event in the lifecycle of the resource.',
    comment: 'Date may be used to express temporal information at any level of granularity. Recommended best practice is to use an encoding scheme, such as the W3CDTF profile of ISO 8601 [W3CDTF].'
  },
  [DC.DESCRIPTION]: {
    uri: DC.DESCRIPTION,
    label: 'Description',
    definition: 'An account of the resource.',
    comment: 'Description may include but is not limited to: an abstract, a table of contents, a graphical representation, or a free-text account of the resource.'
  },
  [DC.FORMAT]: {
    uri: DC.FORMAT,
    label: 'Format',
    definition: 'The file format, physical medium, or dimensions of the resource.',
    comment: 'Examples of dimensions include size and duration. Recommended best practice is to use a controlled vocabulary such as the list of Internet Media Types [MIME].'
  },
  [DC.IDENTIFIER]: {
    uri: DC.IDENTIFIER,
    label: 'Identifier',
    definition: 'An unambiguous reference to the resource within a given context',
    comment: 'Recommended best practice is to identify the resource by means of a string conforming to a formal identification system.'
  },
  [DC.LANGUAGE]: {
    uri: DC.LANGUAGE,
    label: 'language',
    definition: 'A language of the resource.',
    comment: 'Recommended best practice is to use a controlled vocabulary such as RFC 4646 [RFC4646].'
  },
  [DC.PUBLISHER]: {
    uri: DC.PUBLISHER,
    label: 'Publisher',
    definition: 'An entity responsible for making the resource available.',
    comment: 'Examples of a Publisher include a person, an organization, or a service. Typically, the name of a Publisher should be used to indicate the entity.'
  },
  [DC.RELATION]: {
    uri: DC.RELATION,
    label: 'Relation',
    definition: 'A related resource.',
    comment: 'Recommended best practice is to identify the related resource by means of a string conforming to a formal identification system.'
  },
  [DC.RIGHTS]: {
    uri: DC.RIGHTS,
    label: 'Rights',
    definition: 'Information about rights held in and over the resource.',
    comment: 'Typically, rights information includes a statement about various property rights associated with the resource, including intellectual property rights.'
  },
  [DC.SOURCE]: {
    uri: DC.SOURCE,
    label: 'Source',
    definition: 'A related resource from which the described resource is derived.',
    comment: 'The described resource may be derived from the related resource in whole or in part. Recommended best practice is to identify the related resource by means of a string conforming to a formal identification system.'
  },
  [DC.SUBJECT]: {
    uri: DC.SUBJECT,
    label: 'Subject',
    definition: 'The topic of the resource.',
    comment: 'Typically, the subject will be represented using keywords, key phrases, or classification codes. Recommended best practice is to use a controlled vocabulary.'
  },
  [DC.TITLE]: {
    uri: DC.TITLE,
    label: 'Title',
    definition: 'A name given to the resource.'
  },
  [DC.TYPE]: {
    uri: DC.TYPE,
    label: 'Type',
    definition: 'The nature or genre of the resource.',
    comment: 'Recommended best practice is to use a controlled vocabulary such as the DCMI Type Vocabulary [DCMITYPE]. To describe the file format, physical medium, or dimensions of the resource, use the Format element.'
  },

  [S.RECIPIENT]: {
    uri: S.RECIPIENT,
    label: 'Recipient',
    definition: 'A sub property of participant. The participant who is at the receiving end of the action.',
    comment: ''
  },

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
