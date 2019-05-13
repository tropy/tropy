'use strict'

const fs = require('fs')
const { readFile: read, writeFile: write } = fs.promises
const { join, basename, extname } = require('path')
const { any, empty, get, identify, pick, titlecase } = require('./util')
const { Resource } = require('./res')
const N3 = require('n3')
const { TEMPLATE } = require('../constants/ontology')

const {
  RDF, RDFS, DC, TERMS, SKOS, OWL, VANN, TROPY, TYPE
} = require('../constants')


class Template {
  static defaults = {
    type: TROPY.Item,
    name: '',
    creator: '',
    description: '',
    created: null,
    isProtected: false,
    fields: []
  }

  static identify() {
    return `https://tropy.org/v1/templates/id#${identify()}`
  }

  static make(template = Template.defaults) {
    return {
      ...template,
      id: template.id || Template.identify(),
      fields: [...template.fields]
    }
  }

  static copy(template, mapField = Field.copy) {
    return {
      ...pick(template, Template.keys),
      created: null,
      isProtected: false,
      fields: template.fields.map(mapField)
    }
  }

  static async open(path) {
    return JSON.parse(await read(path))
  }

  static save(data, path, options = {}) {
    return write(path, JSON.stringify(Template.parse(data)), options)
  }

  static parse(data) {
    return {
      '@context': TEMPLATE.CONTEXT,
      '@id': data.id,
      '@type': TROPY.Template,
      'type': data.type,
      'name': data.name,
      'version': data.version,
      'domain': data.domain,
      'creator': data.creator,
      'description': data.description,
      'field': data.fields.map(Field.copy)
    }
  }

  static keys = Object.keys(Template.defaults)
}

class Field {
  static defaults = {
    datatype: TYPE.TEXT,
    hint: '',
    isConstant: false,
    isRequired: false,
    label: '',
    property: '',
    value: ''
  }

  static identify() {
    return Field.counter--
  }

  static make(field = Field.defaults) {
    return {
      id: field.id || Field.identify(),
      ...field
    }
  }

  static copy(field) {
    return pick(field, Field.keys)
  }

  static counter = -1
  static keys = Object.keys(Field.defaults)
}

Template.Field = Field


class Ontology extends Resource {
  static get base() {
    return join(super.base, 'vocab')
  }

  static get ext() {
    return '.n3'
  }

  static parse(is) {
    return new Promise((resolve, reject) => {
      const store = new N3.Store()

      new N3.Parser({ format: 'N3' })
        .parse(is, (error, quad ) => {
          if (error) return reject(error)
          if (quad) return store.addQuad(quad)
          resolve(store)
        })
    })
  }

  static async open(input, expand = true) {
    const [path, name] = expand ?
      [Ontology.expand(input), input] : [input, basename(input, extname(input))]

    return new Ontology(await Ontology.parse(fs.createReadStream(path)), name)
  }

  static expand(name) {
    return join(this.base, `${name}${this.ext}`)
  }

  static CLASSES = [
    RDFS.Class,
    OWL.Class
  ]

  static DATATYPES = [
    RDFS.Datatype
  ]

  static PROPERTIES = [
    RDF.Property,
    OWL.ObjectProperty,
    OWL.DatatypeProperty,
    OWL.SymmetricProperty,
    OWL.FunctionalProperty,
    OWL.TransitiveProperty,
    OWL.InverseFunctionalProperty
  ]


  constructor(store, name) {
    super()
    this.store = store
    this.name = name
  }

  toJSON(locale = 'en') {
    let json = {}
    let seq = 0

    let prefix = () => {
      return (++seq > 1) ? `${this.name}${seq}` : this.name
    }

    let collect = (id) => {
      let data = this.getData(id)
      if (empty(data)) return []

      let ns = isDefinedBy(id, data)
      let vocab = json[ns] || this.getVocabulary(ns, prefix(), { locale })

      if (vocab == null) return []
      if (json[ns] == null) json[ns] = vocab

      if (data[RDFS.label]) {
        for (let lbl of data[RDFS.label]) {
          if (lbl['@value'] == null) continue
          vocab.labels.push({
            id, label: lbl['@value'], language: lbl['@language']
          })
        }
      }

      return [vocab, data]
    }

    for (let id of this.getByType(...Ontology.PROPERTIES)) {
      let [vocab, data] = collect(id)
      if (vocab == null) continue

      let domain = get(data, [RDFS.domain, 0, '@id'])
      let range = get(data, [RDFS.range, 0, '@id'])

      vocab.properties.push({
        id, data, vocabulary: vocab.id, domain, range, ...info(data, locale)
      })
    }

    for (let id of this.getByType(...Ontology.CLASSES)) {
      let [vocab, data] = collect(id)
      if (vocab == null) continue
      vocab.classes.push({
        id, data, vocabulary: vocab.id, ...info(data, locale)
      })
    }

    for (let id of this.getByType(...Ontology.DATATYPES)) {
      let [vocab, data] = collect(id)
      if (vocab == null) continue
      vocab.datatypes.push({
        id, data, vocabulary: vocab.id, ...info(data, locale)
      })
    }

    return json
  }

  getVocabulary(id, prefix, { title = id, locale = 'en' } = {}) {
    let data = this.getData(id)

    if (empty(data) && (/[#/]$/).test(id)) {
      data = this.getData(id.slice(0, id.length - 1))
    }

    title = getValue(any(data, DC.title, TERMS.title), locale) || title
    prefix = get(data, [VANN.preferredNamespacePrefix, 0, '@value'], prefix)

    let seeAlso = get(data, [RDFS.seeAlso, 0, '@id'])
    let description = getValue(
      any(data, DC.description, TERMS.description, RDFS.comment), locale
    )

    return {
      id,
      title,
      prefix,
      description,
      seeAlso,
      classes: [],
      datatypes: [],
      labels: [],
      properties: []
    }
  }

  getByType(...types) {
    const ids = []

    this.store.forEach(({ subject, object }) => {
      if (N3.Util.isNamedNode(subject) && N3.Util.isNamedNode(object) &&
        types.includes(object.id)) {
        ids.push(subject.id)
      }
    }, null, RDF.type)

    return ids
  }

  getData(subject, into = {}) {
    return this.store.getQuads(subject).reduce((o, { predicate, object }) =>
      ((o[predicate.id] = [...(o[predicate.id] || []), literal(object)]), o),
      into)
  }

}


function info(data, locale = 'en') {
  return {
    comment: getValue(any(data, RDFS.comment), locale),
    description: getValue(
      any(data, SKOS.defintion, DC.description, TERMS.description), locale
    )
  }
}

function getValue(data, locale = 'en') {
  if (data == null || data.length === 0) {
    return null
  }
  for (let value of data) {
    if (value['@language'] === locale) {
      return value['@value']
    }
  }
  return data[0]['@value']
}

function literal(data) {
  return N3.Util.isLiteral(data) ? {
    '@value': data.value,
    '@type': data.datatype,
    '@language': data.language
  } : {
    '@id': data,
    '@type': '@id'
  }
}

function isDefinedBy(id, data) {
  let ns = get(data, [RDFS.isDefinedBy, 0, '@id'])
  if (ns == null) return namespace(id)
  ns = ns.id || ns
  if (!(/[#/]$/).test(ns)) ns += '#'
  return ns
}

function namespace(id) {
  return split(id)[0]
}

function getLabel(id) {
  return titlecase(split(id)[1]) || id
}

function split(id) {
  let ns = id.split(/(#|\/)/)
  let nm = ns.pop()
  return [ns.join(''), nm]
}


module.exports = {
  getLabel,
  info,
  isDefinedBy,
  literal,
  namespace,
  Ontology,
  Template
}
