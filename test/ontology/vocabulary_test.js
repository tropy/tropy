'use strict'

const N3 = require('n3')

describe('Export Vocabularies', () => {
  const { toN3 } = __require('ontology/vocabulary')
  const { vocab, ontology } = require('../fixtures/export')

  describe('toN3()', () => {
    let output

    before(async () => {
      output = await toN3(vocab, ontology)
    })

    it('creates a string', () => {
      expect(output).to.be.a('string')
    })

    it('can be parsed', () => {
      let parser = new N3.Parser({ format: 'N3' })
      let store = new N3.Store()
      store.addQuads(parser.parse(output))

      expect(store.getQuads('http://example.com/vocab')).to.have.length(6)
      expect(store.getQuads('http://example.com/class')).to.have.length(3)
      expect(store.getQuads('http://example.com/type')).to.have.length(2)
      expect(store.getQuads('http://example.com/photo-property'))
        .to.have.length(2)
    })
  })
})
