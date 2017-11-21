'use strict'

const { EditorState, TextSelection } = require('prosemirror-state')
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

// select 'www'
state = state.apply(
  state.tr.setSelection(
    TextSelection.create(state.doc, offset + 7, offset + 10)))

module.exports = {
  state,
  url
}
