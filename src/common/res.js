'use strict'

const { resolve } = require('./promisify')
const { resolve: cd, join } = require('path')
const { readFileAsync: read, createReadStream: stream } = require('fs')
const { flatten, get, uniq } = require('./util')
const yaml = require('js-yaml')
const N3 = require('n3')
const { RDF, RDFS, OWL } = require('../constants')
const ROOT = cd(__dirname, '..', '..', 'res')



class Resource {
  static get base() {
    return ROOT
  }

  static get ext() {
    return '.yml'
  }

  static parse(data) {
    return yaml.safeLoad(data)
  }

  static async open(name, ...args) {
    return new this(this.parse(await read(this.expand(name))), ...args)
  }

  static openWithFallback(fallback, name, ...args) {
    return resolve(this.open(name, ...args))
      .catch({ code: 'ENOENT' }, () => this.open(fallback, ...args))
  }

  static expand(name) {
    return join(this.base, `${name}${this.ext}`)
  }
}

class Menu extends Resource {
  static get base() {
    return join(super.base, 'menu')
  }

  constructor(data = {}) {
    super()
    this.template = data[process.platform]
  }
}

class Strings extends Resource {
  static get base() {
    return join(super.base, 'strings')
  }

  static open(locale, ...args) {
    return super.open(locale, locale, ...args)
  }

  static expand(locale) {
    return super.expand(`${process.type}.${String(locale).slice(0, 2)}`)
  }

  constructor(dict = {}, locale = 'en') {
    super()
    this.dict = dict
    this.locale = locale
  }

  flatten() {
    return flatten(this.dict)
  }
}

class KeyMap extends Resource {
  static get base() {
    return join(super.base, 'keymaps')
  }

  static open(locale, name, ...args) {
    return super.open(`${name}.${locale}`, locale, ...args)
  }

  constructor(data = {}, locale = 'en') {
    super()
    this.map = data[process.platform]
    this.locale = locale
  }
}

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
    return new this(await this.parse(stream(this.expand(name))))
  }

  constructor(store) {
    super()
    this.store = store
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

  collect = (subject, into = {}) =>
    this.store.getTriples(subject)
      .reduce((obj, { predicate, object }) =>
        ((obj[predicate] = Vocab.literal(object)), obj), into)

  static isDefinedBy(iri, triples) {
    return get(triples, [RDFS.isDefinedBy, 'value']) || Vocab.split(iri)[0]
  }

  static literal(value) {
    return N3.Util.isLiteral(value) ? {
      value: N3.Util.getLiteralValue(value),
      type: N3.Util.getLiteralType(value),
      language: N3.Util.getLiteralLanguage(value)
    } : { value, type: 'IRI' }
  }

  static split(uri) {
    let ns = uri.split(/(#|\/)/)
    let nm = ns.pop()
    return [ns.join(''), nm]
  }

}

module.exports = {
  Resource,
  Menu,
  Strings,
  KeyMap,
  Vocab
}
