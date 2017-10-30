'use strict'

const N3 = require('n3')
const { DC, RDF, RDFS, OWL, VANN } = require('../constants')
const { createLiteral: lang } = N3.Util

const prefixes = {
  // TODO: could these be extracted from ontology.db?
  owl: 'http://www.w3.org/2002/07/owl#',
  vann: 'http://purl.org/vocab/vann/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  dc: 'http://purl.org/dc/elements/1.1/'
}

function toN3(vocab) {
  return new Promise((resolve, reject) => {
    if (vocab.prefix) {
      prefixes[vocab.prefix] = vocab.id
    }

    const writer = N3.Writer({ format: 'N3', prefixes })
    writer.addTriple(vocab.id, RDF.type, OWL.Ontology)

    writer.addTriple(vocab.id, VANN.preferredNamespacePrefix, vocab.prefix)
    writer.addTriple(vocab.id, VANN.preferredNamespaceUri, vocab.id)
    writer.addTriple(vocab.id, RDFS.seeAlso, vocab.seeAlso)
    writer.addTriple(vocab.id, DC.title, lang(vocab.title, 'en'))
    writer.addTriple(vocab.id, DC.description, vocab.description)
    // TODO? dc:issued, dc:publisher

    writer.end(function (error, result) {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

module.exports = {
  toN3
}
