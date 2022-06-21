import { fromHTML } from '../../src/editor/serialize'

describe('editor serialize utils', () => {
  describe('fromHTML', () => {
    it('creates a document from an HTML string', () => {
      let { state } = fromHTML('<p>Test</p>')

      expect(state.doc.type).to.eql('doc')
      expect(state.doc.content).to.have.length(1)
      expect(state.doc.content[0].type).to.eql('paragraph')
      expect(state.doc.content[0].content).to.have.length(1)
      expect(state.doc.content[0].content[0].text).to.eql('Test')
    })
  })
})
