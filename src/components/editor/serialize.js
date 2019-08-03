'use strict'

const { DOMSerializer } = require('prosemirror-model')
const { defaultMarkdownSerializer } = require('prosemirror-markdown')
const { schema } = require('./schema')
const { warn } = require('../../common/log')

const DOM = DOMSerializer.fromSchema(schema)

module.exports = {
  toHTML(doc) {
    try {
      let node = schema.nodeFromJSON(doc)
      let frag = DOM.serializeFragment(node)

      return Array
        .from(frag.children, el => el.outerHTML)
        .join('')

    } catch (e) {
      warn({ stack: e.stack }, 'failed to convert doc to HTML')
      return ''
    }
  },

  toMarkdown(doc) {
    try {
      let node = schema.nodeFromJSON(doc)
      return defaultMarkdownSerializer.serialize(node)

    } catch (e) {
      warn({ stack: e.stack }, 'failed to convert doc to markdown')
      return ''
    }
  }
}
