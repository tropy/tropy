'use strict'

const { EditorState } = require('prosemirror-state')
const { doc, p } = require('prosemirror-test-builder')
const { schema } = __require('components/editor/schema')


const url = 'http://www.example.com'
const offset = 39

let state = EditorState.create({
  doc: doc(
    p('first paragraph'),
    p(`paragraph with link: ${url}`))
})

// add link mark for the url
state = state.apply(
  state.tr.addMark(
    offset,
    offset + url.length,
    schema.marks.link.create({ href: url })))

module.exports = {
  state,
  url,
  offset,
  www: { from: offset + 7, to: offset + 10 } // helper for selection the url
}
