import { TextSelection } from 'prosemirror-state'
import { markExtend } from '../../src/editor/selections.js'

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
  let range = markExtend(s.selection, F.editor.schema.marks.link)
  return select(s, range.from, range.to)
}

describe('markExtend', () => {
  let { state, offset, url, www } = F.editor
  let content = state.doc.toJSON().content
  let p = content[1]

  it('fixture state has a paragraph with a link', () => {
    expect(p.content).to.eql([{
      text: 'paragraph with link: ',
      type: 'text'
    },
    {
      marks: [{
        attrs: {
          href: 'http://www.example.com'
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
    let selected = select(state, ...www)

    expect(selectedText(selected)).to.eql('www')
    expect(selectedText(expand(selected))).to.eql(url)
  })

  it('select inner text within mark (backwards)', () => {
    let selected = select(state, ...www)

    expect(selectedText(selected)).to.eql('www')
    expect(selectedText(expand(selected))).to.eql(url)
  })

  it('select from first letter inward', () => {
    let selected = select(state, offset, offset + 4)

    expect(selectedText(selected)).to.eql('http')
    expect(selectedText(expand(selected))).to.eql(url)
  })

  it('select from last letter inward', () => {
    let selected = select(state, offset + url.length, offset + url.length - 4)

    expect(selectedText(selected)).to.eql('.com')
    expect(selectedText(expand(selected))).to.eql(url)
  })
})
