'use strict'

const { NOTE } = require('../constants/type')

const { DOMSerializer } = require('prosemirror-model')
const { schema } = require('../components/editor/schema')
const { warn } = require('../common/log')

const serializer = DOMSerializer.fromSchema(schema)

function toHTML(doc) {
  try {
    const node = schema.nodeFromJSON(doc)
    const docFragment = serializer.serializeFragment(node)
    return Array
      .from(docFragment.children)
      .map(x => x.outerHTML).join('')
  } catch (error) {
    warn('Could not convert note to html', { error, doc })
    return ''
  }
}

function localize(val, lang) {
  return {
    '@value': val,
    '@language': lang || 'en'
  }
}

module.exports = function (note) {

  return {
    '@type': NOTE,
    'text': localize(note.text, note.language),
    'html': localize(toHTML(note.state.doc), note.language)
  }
}
