'use strict'

describe('exported vocab', () => {
  const N3 = require('N3')
  const { toN3 } = __require('export/vocab')
  const { vocab, classes } = require('../fixtures/export')

  const output = toN3(vocab, classes)
  const parser = N3.Parser({ format: 'N3' })
  const store = N3.Store()

  it('has own metadata', async () => {
    store.addTriples(parser.parse(await output))
    const v = store.getTriplesByIRI('http://example.com/vocab')
    expect(v).to.have.deep.members([
      {
        graph: '',
        object: '"Description"',
        predicate: 'http://purl.org/dc/elements/1.1/description',
        subject: 'http://example.com/vocab'
      },
      {
        graph: '',
        object: '"Test Vocabulary"@en',
        predicate: 'http://purl.org/dc/elements/1.1/title',
        subject: 'http://example.com/vocab',
      },
      {
        graph: '',
        object: 'http://example.com/seeAlso',
        predicate: 'http://www.w3.org/2000/01/rdf-schema#seeAlso',
        subject: 'http://example.com/vocab',
      },
      {
        graph: '',
        object: 'http://example.com/vocab',
        predicate: 'http://purl.org/vocab/vann/preferredNamespaceUri',
        subject: 'http://example.com/vocab',
      },
      {
        graph: '',
        object: '"vocab"',
        predicate: 'http://purl.org/vocab/vann/preferredNamespacePrefix',
        subject: 'http://example.com/vocab',
      },
      {
        graph: '',
        object: 'http://www.w3.org/2002/07/owl#Ontology',
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        subject: 'http://example.com/vocab',
      }])
  })

  it('has classes', async () => {
    store.addTriples(parser.parse(await output))
    const c = store.getTriplesByIRI('http://example.com/class')
    expect(c).to.deep.have.members([
      {
        subject: 'http://example.com/class',
        predicate: 'http://www.w3.org/2000/01/rdf-schema#label',
        object: '"My Class"@en',
        graph: ''
      },
      {
        subject: 'http://example.com/class',
        predicate: 'http://www.w3.org/2000/01/rdf-schema#comment',
        object: '"comment"@en',
        graph: ''
      },
      {
        subject: 'http://example.com/class',
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        object: 'http://www.w3.org/2000/01/rdf-schema#Class',
        graph: ''
      }
    ])
  })


})
