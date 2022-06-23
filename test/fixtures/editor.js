import { EditorState } from 'prosemirror-state'
import { doc, p } from 'prosemirror-test-builder'
import { schema } from '../../src/editor/schema.js'

const url = 'http://www.example.com'
const offset = 39
const www = [offset + 7, offset + 10] // helper for selection the url

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

export default {
  schema,
  state,
  url,
  offset,
  www
}
