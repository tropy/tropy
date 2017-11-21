'use strict'

const { state } = require('../fixtures/editor')
const content = state.doc.toJSON().content
const p = content[1]

describe('EditorState', () => {
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
})
