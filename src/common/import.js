'use strict'

const ex = require('./export')
const { expand, open } = require('./json')
const { rdfs, tropy } = require('./ns')
const { any, array, map, morph, omit, get } = require('./util')

// Expand JSON-LD and ungroup item graph for backwards compatibility!
const normalize = async (json) =>
  array(await expand(json))
    .flatMap(g =>
      g['@graph'].map(item =>
        (tropy.template in item) ? item : {
          [tropy.template]: g[tropy.template],
          ...item
        }))


const flatten = (node) =>
  array(node)
    .flatMap(container => container['@list'] || container)

const toValue = (node) =>
  node['@id'] ?
    { type: rdfs.Class, text: node['@id'] } :
    { type: node['@type'], text: node['@value'] }

const toFirstValue = (_, values) =>
  toValue(values[0])

const getMetadata = (data, skip = ['@id', '@type']) =>
  map(omit(data, skip), toFirstValue)

const isImageProp = (prop) =>
  (prop !== 'template') && (
    ex.props.image.includes(prop) ||
    ex.props.photo.includes(prop)
  )

const getImageProps = (data) =>
  morph(data, (img, prop, values) => {
    if (props.tropy.prefix.test(prop)) {
      let val = any(values[0], '@value', '@id')
      if (val === undefined)
        return

      let key = prop.replace(props.tropy.prefix, '')
      if (!isImageProp(key))
        return

      img[key] = val
    }
  })


const getPhoto = (data) => ({
  data: getMetadata(data, [...props.photo, ...props.image]),
  id: get(data, ['@id', 0]),
  image: getImageProps(data),
  template: get(data, [tropy.template, 0, '@id']),
  type: get(data, ['@type', 0])
})

function *eachItem(graph) {
  for (let data of graph) {
    yield ({
      data: getMetadata(data, props.item),
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
  image: [
    ...ex.props.image.map(prop => tropy[prop])
  ],
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
    ...ex.props.photo.map(prop => tropy[prop])
  ],
  selection: [
    '@id',
    '@type',
    tropy.note,
    ...ex.props.selection.map(prop => tropy[prop])
  ],

  tropy: {
    prefix: new RegExp(`^${tropy.PREFIX}`)
  }
}


module.exports = {
  eachItem,
  normalize,

  async open(...args) {
    return normalize(await open(...args))
  }
}
