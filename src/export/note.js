'use strict'

const { NOTE } = require('../constants/type')

const { DOMSerializer } = require('prosemirror-model')
const { schema } = require('../components/editor/schema')

const serializer = DOMSerializer.fromSchema(schema)

function toHTML(doc) {
  const node = schema.nodeFromJSON(doc)
  const docFragment = serializer.serializeFragment(node)
  return Array.from(docFragment.children).map(x => x.outerHTML).join('')
}

module.exports = function (note) {
  return {
    '@type': NOTE,
    'text': note.text,
    'html': toHTML(note.state.doc),
    'language': note.language
  }
}
