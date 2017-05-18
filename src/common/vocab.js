'use strict'

const { join } = require('path')
const { createReadStream: stream } = require('fs')
const { any, empty, get, uniq } = require('./util')
const { Resource } = require('./res')
const N3 = require('n3')
const { RDF, RDFS, DC, DCT, SKOS, OWL, VANN } = require('../constants')


class Vocab extends Resource {
  static get base() {
    return join(super.base, 'vocab')
  }

  static get ext() {
    return '.n3'
  }

  static parse(is) {
    return new Promise((resolve, reject) => {
      const store = N3.Store()

      N3.Parser({ format: 'N3' })
        .parse(is, (error, triple, prefixes) => {
          if (error) return reject(error)
          if (triple) return store.addTriple(triple)
          store.addPrefixes(prefixes)
          resolve(store)
        })
    })
  }

  static async open(name) {
    return new this(await this.parse(stream(this.expand(name))), name)
  }

  constructor(store, name) {
    super()
    this.store = store
    this.name = name
  }

  toJSON() {
    let json = {}

    let collect = (uri) => {
      let data = this.getData(uri)
      if (empty(data)) return []

      let ns = isDefinedBy(uri, data)
      let vocab = json[ns] || this.getVocabulary(ns)

      if (vocab == null) return []
      json[ns] = vocab

      return [vocab, data]
    }

    for (let uri of this.getProperties()) {
      let [vocab, data] = collect(uri)
      if (vocab == null) continue
      vocab.properties.push({ uri, data, ...info(data) })
    }

    for (let uri of this.getClasses()) {
      let [vocab, data] = collect(uri)
      if (vocab == null) continue
      vocab.classes.push({ uri, data, ...info(data) })
    }

    return json
  }

  getVocabulary(uri, title = this.name, prefix = this.name) {
    const data = this.getData(uri)
    if (empty(data)) return null

    title = get(any(data, DC.title, DCT.title), ['value'], title)
    prefix = get(data, [VANN.preferredNamespacePrefix, 'value'], prefix)

    const description = get(
      any(data, DC.description, DCT.description), ['value']
    )

    return {
      uri, title, prefix, description, classes: [], properties: []
    }
  }

  getProperties() {
    return uniq([
      ...this.store.getSubjects(RDF.type, RDF.Property),
      ...this.store.getSubjects(RDF.type, OWL.ObjectProperty),
      ...this.store.getSubjects(RDF.type, OWL.DatatypeProperty)
    ]).filter(uri => !N3.Util.isBlank(uri))
  }

  getClasses() {
    return uniq([
      ...this.store.getSubjects(RDF.type, RDFS.Class),
      ...this.store.getSubjects(RDF.type, OWL.Class)
    ]).filter(uri => !N3.Util.isBlank(uri))
  }

  getData(subject, into = {}) {
    return this.store.getTriples(subject)
      .reduce((obj, { predicate, object }) =>
        ((obj[predicate] = literal(object)), obj), into)
  }
}


function info(data) {
  return {
    label: get(data, [RDFS.label, 'value']),
    comment: get(data, [RDFS.comment, 'value']),
    definition: get(
      any(data, SKOS.defintion, DC.description, DCT.description), ['value']
    )
  }
}

function literal(value) {
  return N3.Util.isLiteral(value) ? {
    value: N3.Util.getLiteralValue(value),
    type: N3.Util.getLiteralType(value),
    language: N3.Util.getLiteralLanguage(value)
  } : { value, type: 'IRI' }
}

function isDefinedBy(uri, data) {
  return get(data, [RDFS.isDefinedBy, 'value'], namespace(uri))
}

function namespace(uri) {
  return split(uri)[0]
}


function split(uri) {
  let ns = uri.split(/(#|\/)/)
  let nm = ns.pop()
  return [ns.join(''), nm]
}


module.exports = {
  Vocab,
  info,
  isDefinedBy,
  literal,
  namespace
}
