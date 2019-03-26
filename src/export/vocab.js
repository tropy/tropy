'use strict'

const N3 = require('n3')
const { blank } = require('../common/util')
const { DC, RDF, RDFS, OWL, VANN } = require('../constants')
const { namedNode, literal } = N3.DataFactory

const PREFIXES = {
  owl: OWL.ns,
  vann: VANN.ns,
  rdf: RDF.ns,
  rdfs: RDFS.ns,
  dc: DC.ns
}

function addEach(out, ids, type, state) {
  if (blank(ids)) return

  for (let id of ids) {
    let res = state[id]
    if (res == null || !res.id) break

    id = namedNode(res.id)
    out.addQuad(id, namedNode(RDF.type), type)

    if (res.vocabulary) {
      out.addQuad(id,
        namedNode(RDFS.isDefinedBy),
        namedNode(res.vocabulary))
    }
    if (res.comment) {
      out.addQuad(id,
        namedNode(RDFS.comment),
        literal(res.comment, ARGS.locale))
    }
    if (res.label) {
      out.addQuad(id,
        namedNode(RDFS.label),
        literal(res.label, ARGS.locale))
    }
    if (res.description) {
      out.addQuad(id,
        namedNode(DC.description),
        literal(res.description, ARGS.locale))
    }
  }
}

function toN3(vocab, ontology, prefixes = {}) {
  return new Promise((resolve, reject) => {
    if (vocab.prefix) {
      prefixes[vocab.prefix] = vocab.id
    }

    let out = new N3.Writer({ prefixes: { ...PREFIXES, ...prefixes } })
    let id = namedNode(vocab.id)

    out.addQuad(id,
      namedNode(RDF.type),
      namedNode(OWL.Ontology))

    out.addQuad(id,
      namedNode(VANN.preferredNamespacePrefix),
      literal(vocab.prefix))

    out.addQuad(id,
      namedNode(VANN.preferredNamespaceUri),
      id)

    out.addQuad(id,
      namedNode(RDFS.seeAlso),
      namedNode(vocab.seeAlso))

    out.addQuad(id,
      namedNode(DC.title),
      literal(vocab.title, ARGS.locale))

    out.addQuad(id,
      namedNode(DC.description),
      literal(vocab.description, ARGS.locale))

    addEach(out, vocab.classes, namedNode(RDFS.Class), ontology.class)
    addEach(out, vocab.datatypes, namedNode(RDFS.Datatype), ontology.type)
    addEach(out, vocab.properties, namedNode(RDF.Property), ontology.props)

    out.end((error, result) => {
      if (error) return reject(error)
      else resolve(result)
    })
  })
}

module.exports = {
  toN3
}
