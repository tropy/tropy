'use strict'

const N3 = require('n3')
const { DC, RDF, RDFS, OWL, VANN } = require('../constants')
const { createLiteral: l } = N3.Util

const prefixes = {
  // TODO: could these be extracted from ontology.db?
  owl: 'http://www.w3.org/2002/07/owl#',
  vann: 'http://purl.org/vocab/vann/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  dc: 'http://purl.org/dc/elements/1.1/'
}

function toN3(vocab, classes) {
  // use Promise because `writer.end` expects a callback
  return new Promise((resolve, reject) => {
    if (vocab.prefix) {
      prefixes[vocab.prefix] = vocab.id
    }

    const writer = N3.Writer({ format: 'N3', prefixes })
    writer.addTriple(vocab.id, RDF.type, OWL.Ontology)

    // own properties
    writer.addTriple(vocab.id, VANN.preferredNamespacePrefix, l(vocab.prefix))
    writer.addTriple(vocab.id, VANN.preferredNamespaceUri, vocab.id)
    writer.addTriple(vocab.id, RDFS.seeAlso, vocab.seeAlso)
    writer.addTriple(vocab.id, DC.title, l(vocab.title, 'en'))
    writer.addTriple(vocab.id, DC.description, l(vocab.description))

    // classes
    for (let classId of vocab.classes) {
      const c = classes[classId]
      c.id && writer.addTriple(c.id, RDF.type, RDFS.Class)
      c.vocabulary && writer.addTriple(c.id, RDFS.isDefinedBy, c.vocabulary)
      c.comment && writer.addTriple(c.id, RDFS.comment, l(c.comment, 'en'))
      c.label && writer.addTriple(c.id, RDFS.label, l(c.label, 'en'))
      c.description && writer.addTriple(c.id, DC.description, l(c.description))
    }

    // settle the promise
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
