import { Writer, DataFactory } from 'n3'
import { blank } from '../common/util'
import { dc, rdf, rdfs, owl, vann } from './ns'

const { namedNode, literal } = DataFactory

const PREFIXES = {
  owl: owl.BASE,
  vann: vann.BASE,
  rdf: rdf.BASE,
  rdfs: rdfs.BASE,
  dc: dc.BASE
}

function addEach(out, ids, type, state) {
  if (blank(ids)) return

  for (let id of ids) {
    let res = state[id]
    if (res == null || !res.id) break

    id = namedNode(res.id)
    out.addQuad(id, namedNode(rdf.type), type)

    if (res.vocabulary) {
      out.addQuad(id,
        namedNode(rdfs.isDefinedBy),
        namedNode(res.vocabulary))
    }
    if (res.comment) {
      out.addQuad(id,
        namedNode(rdfs.comment),
        literal(res.comment, ARGS.locale))
    }
    if (res.label) {
      out.addQuad(id,
        namedNode(rdfs.label),
        literal(res.label, ARGS.locale))
    }
    if (res.description) {
      out.addQuad(id,
        namedNode(dc.description),
        literal(res.description, ARGS.locale))
    }
  }
}

export function toN3(vocab, ontology, prefixes = {}) {
  return new Promise((resolve, reject) => {
    if (vocab.prefix) {
      prefixes[vocab.prefix] = vocab.id
    }

    let out = new Writer({ prefixes: { ...PREFIXES, ...prefixes } })
    let id = namedNode(vocab.id)

    out.addQuad(id,
      namedNode(rdf.type),
      namedNode(owl.Ontology))

    out.addQuad(id,
      namedNode(vann.preferredNamespacePrefix),
      literal(vocab.prefix))

    out.addQuad(id,
      namedNode(vann.preferredNamespaceUri),
      id)

    out.addQuad(id,
      namedNode(rdfs.seeAlso),
      namedNode(vocab.seeAlso))

    out.addQuad(id,
      namedNode(dc.title),
      literal(vocab.title, ARGS.locale))

    out.addQuad(id,
      namedNode(dc.description),
      literal(vocab.description, ARGS.locale))

    addEach(out, vocab.classes, namedNode(rdfs.Class), ontology.class)
    addEach(out, vocab.datatypes, namedNode(rdfs.Datatype), ontology.type)
    addEach(out, vocab.properties, namedNode(rdf.Property), ontology.props)

    out.end((error, result) => {
      if (error) return reject(error)
      else resolve(result)
    })
  })
}
