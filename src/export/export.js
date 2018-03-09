'use strict'

const { promises: jsonld } = require('jsonld')

const { pick, pluck } = require('../common/util')
const { ITEM, PHOTO, SELECTION } = require('../constants/type')
const makeNote = require('./note')

const TR = 'https://tropy.org/v1/tropy#'

const PROP = {
  TEMPLATE: `${TR}template`,
  ITEM: `${TR}item`,
  PHOTO: `${TR}photo`,
  SELECTION: `${TR}selection`,
  NOTE: `${TR}note`
}

const EXPORT_MEDIA = [
  'angle',
  'brightness',
  'contrast',
  'height',
  'hue',
  'mirror',
  'negative',
  'saturation',
  'width',
]
const EXPORT_PROPERTIES = {
  SELECTION: [
    'x',
    'y',
    ...EXPORT_MEDIA
  ],
  PHOTO: [
    'checksum',
    'mimetype',
    'orientation',
    'size',
    ...EXPORT_MEDIA
  ]
}

const { newProperties } = require('./utils')

function makeContext(template, items, resources) {
  const [props, metadata, photos] = resources
  const flatten = (acc, ps) => acc.concat(ps)
  let result = {
    '@version': 1.1,
    '@vocab': TR,
    'template': {
      '@id': PROP.TEMPLATE,
      '@type': '@id'
    },
    'photo': {
      '@id': PROP.PHOTO,
      '@container': '@list',
      '@context': {
        note: {
          '@container': '@list',
          '@id': PROP.NOTE
        },
        selection: {
          '@id': PROP.SELECTION,
          '@container': '@list',
          '@context': {}
        }
      }
    }
  }

  // fill context up with item metadata fields
  const metadataOfItems = pluck(metadata, items.map(i => i.id))
  result = newProperties(metadataOfItems, result, true, props, template)

  // add Photo metadata fields to context from all selected photos
  const photoIDs = items.map(i => i.photos).reduce(flatten, [])
  const metadataOfPhotos = pluck(metadata, photoIDs)
  const photoContext = result['photo']['@context']
  const newPhotoProperties = newProperties(
    metadataOfPhotos, photoContext, true, props, template)
  result['photo']['@context'] = newPhotoProperties

  // add Selection metadata fields to context from all selections metadata
  const selectionIDs = pluck(photos, photoIDs)
        .map(p => p.selections).reduce(flatten, [])
  const metadataOfSelections = pluck(metadata, selectionIDs)
  const newSelectionProperties = newProperties(
    metadataOfSelections, {}, true, props, template)
  result['photo']['@context']['selection']['@context'] =
    newSelectionProperties

  return result
}

function addInfo(target, ids, key, state, fn = x => x.name) {
  if (ids && ids.length) {
    // extract relevant data from related subjects
    target[key] = pluck(state, ids).map(fn)
    if (target[key].length === 1) {
      // extract single item from list
      target[key] = target[key][0]
    } else if (target[key].length === 0) {
      // remove empty lists
      delete target[key]
    }
  }
  return target
}

function addSelections(template, photo, ids, resources) {
  const [props, metadata,,,, notes, selections] = resources

  if (ids) {
    photo.selection = ids.map(sID => {
      let selection = { '@type': SELECTION }
      const original = selections[sID]
      // add selection properties
      Object.assign(selection, pick(original, EXPORT_PROPERTIES.SELECTION))

      // add selection notes
      selection = addInfo(selection, original.notes, 'note', notes, makeNote)

      // add selection metadata
      selection = newProperties(
        metadata[sID], selection, false, props, template)
      return selection
    })
  }
  // clear property if there are no selections
  if (!photo.selection.length) {
    delete photo.selection
  }

  return photo
}

function renderItem(item, template, resources) {
  const [props, metadata, photos, lists, tags, notes] = resources

  // the item starts with a photo property, it may not be overwritten
  let result = { '@type': ITEM, 'photo': [] }

  result = addInfo(result, item.lists, 'list', lists)
  result = addInfo(result, item.tags, 'tag', tags)

  // add item metadata
  result = newProperties(metadata[item.id], result, false, props, template)

  // add photo metadata
  result.photo = item.photos.map(photoID => {
    const p = photos[photoID]

    let photo = {
      '@type': PHOTO,
      'path': p.path,
      'selection': [],
      ...pick(p, EXPORT_PROPERTIES.PHOTO)
    }

    photo = newProperties(metadata[p.id], photo, false, props, template)

    photo = addInfo(photo, p.notes, 'note', notes, makeNote)

    photo = addSelections(template, photo, p.selections, resources)

    return photo
  })

  // clear property if there are no photos
  if (!result.photo.length) {
    delete result.photo
  }

  return result
}

function makeDocument(template, items, resources) {
  const result = {
    'template': template.id,
    '@graph': []
  }
  for (const item of items) {
    const rendered = renderItem(item, template, resources)
    result['@graph'].push(rendered)
  }
  return result
}

async function groupedByTemplate(templateItems, resources) {
  const results = []
  for (const templateID in templateItems) {
    const { items, template } = templateItems[templateID]
    const context = makeContext(template, items, resources)
    const document = makeDocument(template, items, resources)
    document['@context'] = context
    results.push(await jsonld.compact(document, context))
  }
  return results
}

module.exports = {
  groupedByTemplate
}
