'use strict'

const { TextSelection } = require('prosemirror-state')
const { state, url } = require('../fixtures/editor')
const { schema } = __require('components/editor/schema')
const { markExtend } = __require('components/editor/selections')

function selectedText(s) {
  return s.doc.cut(
    s.selection.from,
    s.selection.to).textContent
}

describe('EditorState', () => {
  const content = state.doc.toJSON().content
  const p = content[1]

  it('has a paragraph with a link', () => {
    expect(p.content).to.eql([{
      text: 'paragraph with link: ',
      type: 'text'
    },
    {
      marks: [{
        attrs: {
          href: 'http://www.example.com',
          title: null
        },
        type: 'link'
      }],
      text: 'http://www.example.com',
      type: 'text'
    }
    ])
  })

  it('markExtend works correctly', () => {
    // ensure we're over a link
    expect(selectedText(state)).to.eql('www')

    // expand mark
    const range = markExtend(state.selection, schema.marks.link)
    const stateExpanded = state.apply(
      state.tr.setSelection(
        TextSelection.create(state.doc, range.from, range.to)))

    // ensure only the url is selected
    expect(selectedText(stateExpanded)).to.eql(url)
  })
})
