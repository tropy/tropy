'use strict'

const { PROPERTIES } = require('../constants')
const { TR, S } = PROPERTIES

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
  [TR.PIECE]: {
    uri: TR.PIECE,
    label: 'Piece',
    definition: 'A unit of archival organization, usually within a folder.',
    comment: ''
  },
  [TR.CLASSIFICATION]: {
    uri: TR.CLASSIFICATION,
    label: 'Classification',
    definition: 'A systematic arrangement in groups according to established criteria.',
    comment: ''
  },

  [S.RECIPIENT]: {
    uri: S.RECIPIENT,
    label: 'Recipient',
    definition: 'A sub property of participant. The participant who is at the receiving end of the action.',
    comment: ''
  }
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
