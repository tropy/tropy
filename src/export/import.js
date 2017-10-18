'use strict'

const { promises: jsonld } = require('jsonld')

const { omit } = require('../common/util')
const { TEMPLATE } = require('../constants/ontology')

class ParseError extends Error {
  constructor(obj, ...args) {
    super(...args)
    Error.captureStackTrace(this, ParseError)

    this.details = JSON.stringify(obj, null, 2)
  }
}

async function itemFromLD(obj) {
  let metadata, type, templateID
  try {
    const [expanded] = await jsonld.expand(obj)
    type = expanded['@type'][0]
    templateID = expanded[TEMPLATE.TYPE][0]['@id']
    metadata = omit(expanded, ['@type', TEMPLATE.TYPE])
  } catch (e) {
    throw new ParseError(obj, 'Could not parse jsonld object')
  }

  // convert metadata to a format supported by `mod.item.create`
  let md = {}
  for (let property in metadata) {
    const [prop] = metadata[property]
    md[property] =  {
      type: prop['@type'],
      text: prop['@value']
    }
  }

  return { type, templateID, metadata: md }
}

module.exports = {
  itemFromLD,
  ParseError
}
