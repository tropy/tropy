'use strict'

const util = require('./util')
const { toHTML, toMarkdown } = require('../components/editor/serialize')

const serialize = (note, {
  format = { text: true, html: true },
  localize = true
} = {}) => (
  (note == null) ? null :
    Object
      .entries(format)
      .reduce((acc, [fmt, include]) => {
        if (include) {
          switch (fmt) {
            case 'text':
              acc.text = localize ?
                util.localize(note.text, note.language) :
                note.text
              break
            case 'html':
              acc.html = localize ?
                util.localize(toHTML(note.state.doc), note.language) :
                toHTML(note.state.doc)
              break
            case 'markdown':
              acc.markdown = localize ?
                util.localize(toMarkdown(note.state.doc), note.language) :
                toMarkdown(note.state.doc)
              break
          }
        }
        return acc
      }, {})
)

module.exports = {
  serialize
}
