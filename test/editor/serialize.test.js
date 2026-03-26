import { fromHTML } from '#tropy/editor/serialize.js'

describe('editor serialize utils', () => {
  describe('fromHTML', () => {
    it('creates a document from an HTML string', () => {
      let { state } = fromHTML('<p>Test</p>')

      expect(state.doc.type).to.equal('doc')
      expect(state.doc.content).to.have.length(1)
      expect(state.doc.content[0].type).to.equal('paragraph')
      expect(state.doc.content[0].content).to.have.length(1)
      expect(state.doc.content[0].content[0].text).to.equal('Test')
    })
  })
})
