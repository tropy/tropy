'use strict'

const { DOMParser, DOMSerializer } = require('prosemirror-model')
const { EditorState } = require('prosemirror-state')
const { defaultMarkdownSerializer } = require('prosemirror-markdown')
const { schema } = require('./schema')
const { warn } = require('../../common/log')

const util = require('../../export/util')

const serializer = DOMSerializer.fromSchema(schema)
const parser = DOMParser.fromSchema(schema)

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

const fromHTML = (html) => {
  let dom = (new window.DOMParser).parseFromString(html, 'text/html')
  let doc = parser.parse(dom)
  let text = doc.textBetween(0, doc.content.size, ' ', ' ')

  return {
    state: EditorState.create({ schema, doc }).toJSON(),
    text
  }
}


const toHTML = (doc) => {
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
}

const toMarkdown = (doc) => {
  try {
    let node = schema.nodeFromJSON(doc)
    return defaultMarkdownSerializer.serialize(node)

  } catch (e) {
    warn({ stack: e.stack }, 'failed to convert doc to markdown')
    return ''
  }
}

module.exports = {
  fromHTML,
  serialize,
  toHTML,
  toMarkdown
}
