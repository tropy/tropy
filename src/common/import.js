import gt from 'semver/functions/gt.js'
import * as ex from './export.js'
import { expand } from './json.js'
import { rdfs, tropy, xsd, dc, dcterms } from '../ontology/index.js'
import { URI, any, array, map, morph, omit, get } from './util.js'

// Expand JSON-LD and ungroup item graph for backwards compatibility!
export async function normalize(json) {
  if (Array.isArray(json)) {
    if (!json[0]?.['@context']) {
      json = {
        '@context': ex.ctx.item,
        '@graph': json
      }
    }
  } else {
    if (!json['@context']) {
      json['@context'] = ex.ctx.item
    }
  }

  // Hoist nested contexts used until 1.8.0
  if (json.version && !gt(json.version, '1.8.0')) {
    json['@context'] = {
      ...json['@context'],
      ...ex.ctx.item
    }
  }

  return array(await expand(json)).flatMap(g =>
    (!g['@graph']) ?
      g :
      g['@graph'].map(item =>
        (tropy.template in item) ? item : {
          [tropy.template]: g[tropy.template],
          ...item
        }))
}

const flatten = (node) =>
  array(node)
    .flatMap(container => container['@list'] || container)

const coerce = (value, key) => {
  switch (key) {
    case dc.date:
    case dcterms.date:
      return tropy.date
    default:
      return (typeof value === 'number') ? xsd.integer : xsd.string
  }
}

const toValue = (node, key) => {
  let text
  let type

  if (node['@id']) {
    type = rdfs.Class,
    text = node['@id']

  } else {
    text = node['@value']
    type = node['@type'] || coerce(text, key)
  }

  return { text, type }
}

const toFirstValue = (key, values) =>
  toValue(values[0], key)

const getMetadata = (data, type) =>
  map(omit(data, props[type]), toFirstValue)

const getProps = (data, type, ...args) =>
  morph(data, (img, prop, values) => {
    let value = any(values[0], '@value', '@id')
    if (value === undefined)
      return
    if (props[type].skip.includes(prop))
      return
    if (!props[type].includes(prop))
      return

    img[URI.split(prop)[1]] = value
  }, ...args)

const getPhoto = (data) => ({
  data: getMetadata(data, 'photo'),
  id: get(data, ['@id', 0]),
  image: getProps(data, 'photo', {
    checksum: 'badc0de',
    mimetype: 'image/x.pending'
  }),
  notes: flatten(data[tropy.note]).map(getNote),
  selections: flatten(data[tropy.selection]).map(getSelection),
  template: get(data, [tropy.template, 0, '@id']),
  type: get(data, ['@type', 0])
})

const getSelection = (data) => ({
  data: getMetadata(data, 'selection'),
  id: get(data, ['@id', 0]),
  notes: flatten(data[tropy.note]).map(getNote),
  type: get(data, ['@type', 0]),
  template: get(data, [tropy.template, 0, '@id']),
  ...getProps(data, 'selection')
})

const getNote = (data) => ({
  language: get(data, [tropy.html, 0, '@language']),
  html: get(data, [tropy.html, 0, '@value'])
})

export function *eachItem(graph) {
  for (let data of graph) {
    yield ({
      data: getMetadata(data, 'item'),
      id: get(data, ['@id', 0]),
      // lists: (data[tropy.list] || []).map(literal),
      photos: flatten(data[tropy.photo]).map(getPhoto),
      tags: (data[tropy.tag] || []).map(n => n['@value']),
      template: get(data, [tropy.template, 0, '@id']),
      type: get(data, ['@type', 0])
    })

  }
}

const props = {
  item: [
    '@id',
    '@type',
    tropy.list,
    tropy.photo,
    tropy.tag,
    ...ex.props.item.map(prop => tropy[prop])
  ],
  photo: [
    '@id',
    '@type',
    tropy.note,
    tropy.selection,
    ...ex.props.photo.map(prop => tropy[prop]),
    ...ex.props.image.map(prop => tropy[prop])
  ],
  selection: [
    '@id',
    '@type',
    tropy.note,
    ...ex.props.selection.map(prop => tropy[prop]),
    ...ex.props.image.map(prop => tropy[prop])
  ]
}

props.photo.skip = [
  '@id', '@type', tropy.template, tropy.selection, tropy.note
]

props.selection.skip = [
  '@id', '@type', tropy.note
]
