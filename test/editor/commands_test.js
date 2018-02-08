'use strict'

const { TextSelection } = require('prosemirror-state')
const { state, url, www, offset } = require('../fixtures/editor')
const { schema } = __require('components/editor/schema')
const { markExtend } = __require('components/editor/selections')

function selectedText(s) {
  return s.doc.cut(
    s.selection.from,
    s.selection.to).textContent
}

function select(s, from, to) {
  return s.apply(
    s.tr.setSelection(
      TextSelection.create(s.doc, from, to)))
}

function expand(s) {
  const range = markExtend(s.selection, schema.marks.link)
  return select(s, range.from, range.to)
}

describe('markExtend', () => {
  const content = state.doc.toJSON().content
  const p = content[1]

  it('fixture state has a paragraph with a link', () => {
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

  it('fixture state has nothing selected', () => {
    expect(selectedText(state)).to.eql('')
  })

  it('select inner text within mark', () => {
    const selected = select(state, www.from, www.to)
    expect(selectedText(selected)).to.eql('www')

    expect(selectedText(expand(selected))).to.eql(url)
  })

  it('select inner text within mark (backwards)', () => {
    const selected = select(state, www.to, www.from)
    expect(selectedText(selected)).to.eql('www')

    expect(selectedText(expand(selected))).to.eql(url)
  })

  it('select from first letter inward', () => {
    const selected = select(state, offset, offset + 4)
    expect(selectedText(selected)).to.eql('http')

    expect(selectedText(expand(selected))).to.eql(url)
  })

  it('select from last letter inward', () => {
    const selected = select(state, offset + url.length, offset + url.length - 4)
    expect(selectedText(selected)).to.eql('.com')

    expect(selectedText(expand(selected))).to.eql(url)
  })

  it('select from within mark outside to the left', () => {
    const selected = select(state, offset + 4, offset - 6)
    expect(selectedText(selected)).to.eql('link: http')

    expect(selectedText(expand(selected))).to.eql(url)
  })

  it('select from outside left to within the mark', () => {
    const selected = select(state, offset - 6, offset + 4)
    expect(selectedText(selected)).to.eql('link: http')

    expect(selectedText(expand(selected))).to.eql(url)
  })
})
