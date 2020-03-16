'use strict'

module.exports = {
  vocab: {
    'https://tropy.org/v1/tropy#': {
      id: 'https://tropy.org/v1/tropy#',
      prefix: 'tropy',
      classes: [
        'https://tropy.org/v1/tropy#Item',
        'https://tropy.org/v1/tropy#Image',
        'https://tropy.org/v1/tropy#Photo',
        'https://tropy.org/v1/tropy#Selection',
        'https://tropy.org/v1/tropy#Note',
        'https://tropy.org/v1/tropy#Template',
        'https://tropy.org/v1/tropy#Field',
        'https://tropy.org/v1/tropy#List',
        'https://tropy.org/v1/tropy#Tag'
      ],
      datatypes: [
        'https://tropy.org/v1/tropy#date',
        'https://tropy.org/v1/tropy#name'
      ],
      properties: [
        'https://tropy.org/v1/tropy#box',
        'https://tropy.org/v1/tropy#folder',
        'https://tropy.org/v1/tropy#piece'
      ]
    },
    'http://purl.org/dc/elements/1.1/': {
      id: 'http://purl.org/dc/elements/1.1/',
      prefix: 'dc',
      classes: [],
      datatypes: [],
      properties: [
        'http://purl.org/dc/elements/1.1/title'
      ]
    },
    'http://purl.org/dc/terms/': {
      id: 'http://purl.org/dc/terms/',
      prefix: 'dcterms',
      classes: [],
      datatypes: [],
      properties: [
        'http://purl.org/dc/terms/title'
      ]
    },

    'class': {
      'https://tropy.org/v1/tropy#Item': {
        comment: 'A Tropy Item',
        id: 'https://tropy.org/v1/tropy#Item',
        label: 'Item'
      }
    },

    'props': {
      'http://purl.org/dc/elements/1.1/title': {
        id: 'http://purl.org/dc/elements/1.1/title',
        label: 'Title',
        vocabulary: 'http://purl.org/dc/elements/1.1/'
      },
      'http://purl.org/dc/terms/title': {
        id: 'http://purl.org/dc/terms/title',
        label: 'Title',
        vocabulary: 'http://purl.org/dc/terms/'
      },
      'https://tropy.org/v1/tropy#box': {
        id: 'https://tropy.org/v1/tropy#box',
        label: 'Box',
        vocabulary: 'https://tropy.org/v1/tropy#'
      }
    },

    'type': {
      'https://tropy.org/v1/tropy#date': {
        id: 'https://tropy.org/v1/tropy#date',
        vocabulary: 'https://tropy.org/v1/tropy#'
      }
    }
  }
}
