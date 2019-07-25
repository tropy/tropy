'use strict'

const { TROPY } = require('../constants')
const { toHTML } = require('../components/editor/serialize')

function localize(val, lang) {
  return lang ? {
    '@value': val,
    '@language': lang
  } : val
}

module.exports = function (note) {
  return {
    '@type': TROPY.Note,
    'text': localize(note.text, note.language),
    'html': localize(toHTML(note.state.doc), note.language)
  }
}
