'use strict'

describe('editor serialize utils', () => {
  const Editor = __require('components/editor/serialize')

  describe('fromHTML', () => {
    it('creates a document from an HTML string', () => {
      let { state } = Editor.fromHTML('<p>Test</p>')

      expect(state.doc.type).to.eql('doc')
      expect(state.doc.content).to.have.length(1)
      expect(state.doc.content[0].type).to.eql('paragraph')
      expect(state.doc.content[0].content).to.have.length(1)
      expect(state.doc.content[0].content[0].text).to.eql('Test')
    })
  })
})
