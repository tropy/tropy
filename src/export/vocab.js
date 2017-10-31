'use strict'

const N3 = require('n3')
const { DC, RDF, RDFS, OWL, VANN } = require('../constants')
const { createLiteral: literal } = N3.Util

const prefixes = {
  owl: OWL.ns,
  vann: VANN.ns,
  rdf: RDF.ns,
  rdfs: RDFS.ns,
  dc: DC.ns
}

const translated = (str) => literal(str, ARGS.locale)

function addTriples(writer, property, collection, type) {
  for (let id of property || []) {
    const x = collection[id]
    if (x.id) {
      writer.addTriple(x.id, RDF.type, type)
    }
    if (x.vocabulary) {
      writer.addTriple(x.id, RDFS.isDefinedBy, x.vocabulary)
    }
    if (x.comment) {
      writer.addTriple(x.id, RDFS.comment, translated(x.comment))
    }
    if (x.label) {
      writer.addTriple(x.id, RDFS.label, translated(x.label))
    }
    if (x.description) {
      writer.addTriple(x.id, DC.description, literal(x.description))
    }
  }
}

function toN3(vocab, classes, props, datatypes) {
  // use Promise because `writer.end` expects a callback
  return new Promise((resolve, reject) => {
    if (vocab.prefix) {
      prefixes[vocab.prefix] = vocab.id
    }

    const writer = N3.Writer({ format: 'N3', prefixes })
    writer.addTriple(vocab.id, RDF.type, OWL.Ontology)

    // own properties
    writer.addTriple(
      vocab.id, VANN.preferredNamespacePrefix, literal(vocab.prefix))
    writer.addTriple(vocab.id, VANN.preferredNamespaceUri, vocab.id)
    writer.addTriple(vocab.id, RDFS.seeAlso, vocab.seeAlso)
    writer.addTriple(vocab.id, DC.title, translated(vocab.title))
    writer.addTriple(vocab.id, DC.description, literal(vocab.description))

    addTriples(writer, vocab.classes, classes, RDFS.Class)
    addTriples(writer, vocab.datatypes, datatypes, RDFS.Datatype)
    addTriples(writer, vocab.properties, props, RDF.Property)

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
