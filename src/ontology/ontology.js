import { createReadStream } from 'fs'
import { join, basename, extname } from 'path'
import * as N3 from 'n3'
import { any, empty, get, URI } from '../common/util'
import { Resource } from '../common/res'
import { dc, dcterms, owl, rdf, rdfs, skos, vann } from './ns'


export class Ontology extends Resource {
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
        .parse(is, (error, quad) => {
          if (error) return reject(error)
          if (quad) return store.addQuad(quad)
          resolve(store)
        })
    })
  }

  static async open(input, expand = true) {
    const [path, name] = expand ?
      [Ontology.expand(input), input] : [input, basename(input, extname(input))]

    return new Ontology(await Ontology.parse(createReadStream(path)), name)
  }

  static expand(name) {
    return join(this.base, `${name}${this.ext}`)
  }

  static CLASSES = [
    rdfs.Class,
    owl.Class
  ]

  static DATATYPES = [
    rdfs.Datatype
  ]

  static PROPERTIES = [
    rdf.Property,
    owl.ObjectProperty,
    owl.DatatypeProperty,
    owl.SymmetricProperty,
    owl.FunctionalProperty,
    owl.TransitiveProperty,
    owl.InverseFunctionalProperty
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

      if (data[rdfs.label]) {
        for (let lbl of data[rdfs.label]) {
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

      let domain = get(data, [rdfs.domain, 0, '@id'])
      let range = get(data, [rdfs.range, 0, '@id'])

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

    title = getValue(any(data, dc.title, dcterms.title), locale) || title
    prefix = get(data, [vann.preferredNamespacePrefix, 0, '@value'], prefix)

    let seeAlso = get(data, [rdfs.seeAlso, 0, '@id'])
    let description = getValue(
      any(data, dc.description, dcterms.description, rdfs.comment), locale
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
    }, null, rdf.type)

    return ids
  }

  getData(subject, into = {}) {
    return this.store.getQuads(subject).reduce((o, { predicate, object }) =>
      ((o[predicate.id] = [...(o[predicate.id] || []), literal(object)]), o),
      into)
  }

}


export function info(data, locale = 'en') {
  return {
    comment: getValue(any(data, rdfs.comment), locale),
    description: getValue(
      any(data, skos.defintion, dc.description, dcterms.description), locale
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

export function literal(data) {
  return N3.Util.isLiteral(data) ? {
    '@value': data.value,
    '@type': data.datatype,
    '@language': data.language
  } : {
    '@id': data,
    '@type': '@id'
  }
}

export function isDefinedBy(id, data) {
  let ns = get(data, [rdfs.isDefinedBy, 0, '@id'])
  if (ns == null) return URI.namespace(id)
  ns = ns.id || ns
  if (!(/[#/]$/).test(ns)) ns += '#'
  return ns
}
