'use strict'

const { DOMParser, DOMSerializer } = require('prosemirror-model')
const { EditorState } = require('prosemirror-state')
const { defaultMarkdownSerializer } = require('prosemirror-markdown')
const { schema } = require('./schema')
const { warn } = require('../../common/log')

const serializer = DOMSerializer.fromSchema(schema)
const parser = DOMParser.fromSchema(schema)

module.exports = {
  fromHTML(html) {
    let dom = (new window.DOMParser).parseFromString(html, 'text/html')
    let doc = parser.parse(dom)
    let text = doc.textBetween(0, doc.content.size, ' ', ' ')

    return {
      state: EditorState.create({ schema, doc }).toJSON(),
      text
    }
  },

  toHTML(doc) {
    try {
      let node = schema.nodeFromJSON(doc)
      let frag = serializer.serializeFragment(node)

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
