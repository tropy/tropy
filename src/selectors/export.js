'use strict'

const { ctx, props } = require('../common/export')
const { xsd } = require('../common/ns')
const { version } = require('../common/release')
const { blank, URI, get, pick } = require('../common/util')
const { serialize } = require('../editor/serialize')

const reserved = Object.fromEntries(props.all.map(prop => ([prop, true])))

const getExportItemIds = ({ nav, qr }, { id } = {}) =>
  (id?.length > 0) ? id : (nav.items.length > 0 ? nav.items : qr.items)

const getExportItems = (state, props = {}) => {
  let context = ctx.item
  let ids = getExportItemIds(state, props)

  let graph = ids.map(id =>
    exportItem(context, state.items[id], state))

  return {
    '@context': context,
    '@graph': graph,
    version
  }
}

const exportItem = (context, item, state) => {
  let output = {
    '@type': 'Item',
    'template': item.template
  }

  addMetadata(context, output, state.metadata[item.id], state.ontology)

  if (item.lists.length > 0) {
    output.list = item.lists
      .map(id => get(state, ['lists', id, 'name']))
      .filter(x => !blank(x))
  }

  if (item.tags.length > 0) {
    output.tag = item.tags
      .map(id => get(state, ['tags', id, 'name']))
      .filter(x => !blank(x))
  }

  if (item.photos.length > 0) {
    output.photo = item.photos.map(id =>
      exportPhoto(context, state.photos[id], state))
  }

  return output
}

const exportPhoto = (context, photo, state) => {
  let output = {
    '@type': 'Photo',
    ...pick(photo, props.photo),
    ...pick(photo, props.image)
  }

  addMetadata(context, output, state.metadata[photo.id], state.ontology)

  if (photo.notes.length > 0) {
    output.note = photo.notes.map(id =>
      exportNote(state.notes[id], state.settings?.export?.note))
  }

  if (photo.selections.length > 0) {
    output.selection = photo.selections.map(id =>
      exportSelection(context, state.selections[id], state))
  }

  return output
}

const exportSelection = (context, selection, state) => {
  let output = {
    '@type': 'Selection',
    ...pick(selection, props.selection),
    ...pick(selection, props.image)
  }

  addMetadata(context, output, state.metadata[selection.id], state.ontology)

  if (selection.notes.length > 0) {
    output.note = selection.notes.map(id =>
      exportNote(state.notes[id], state.settings?.export?.note))
  }

  return output
}

const exportNote = (note, opts) => ({
  '@type': 'Note',
  ...serialize(note, opts)
})

const addMetadata = (context, into, data, ontology = {}) => {
  for (let prop in data) {
    if (prop === 'id') continue
    if (prop === 'pending') continue

    let [vocab, name] = URI.split(prop)

    if ((name in context) || (name in reserved)) {
      if (prop !== (context[name]?.['@id'] || context[name])) {
        let prefix = get(ontology.vocab, [vocab, 'prefix'])

        if (prefix) {
          if (prefix in context) {
            if (context[prefix] === vocab) {
              name = `${prefix}:${name}`
            } else {
              name = prop
            }

          } else {
            context[prefix] = vocab
            name = `${prefix}:${name}`
          }

        } else {
          name = prop
        }
      }

    } else {
      if (vocab !== context['@vocab']) {
        context[name] = toContext(prop, data[prop].type)
      }
    }

    into[name] = toValue(data[prop], context[name])
  }
}

const toValue = ({ type, text }, context = {}) => {
  if (context['@type']) {
    if (type === context['@type'])
      return text

  } else {
    if (type === xsd.string)
      return text
    if (type === xsd.integer)
      return Number(text)
  }

  return {
    '@type': type,
    '@value': text
  }
}

const toContext = (prop, type) =>
  (type === xsd.string || type === xsd.integer) ?
    prop :
    { '@id': prop, '@type': type }

module.exports = {
  getExportItemIds,
  getExportItems
}
