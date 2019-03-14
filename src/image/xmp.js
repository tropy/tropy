'use strict'

const { $, $$, parse } = require('../dom')
const { debug, verbose } = require('../common/log')
const { blank } = require('../common/util')
const { text } = require('../value')
const { XMLNS } = require('../constants')

module.exports = {
  xmp(buffer) {
    try {
      if (!blank(buffer)) {
        let input = strip(buffer).toString('utf-8')
        let doc = parse(input, 'application/xml')
        let main = $('xmpmeta', doc)
        let data = {}

        if (!main) {
          throw new Error('no XMP meta node found')
        }

        let desc = $('Description', main)

        if (desc) {
          for (let attr of desc.attributes) {
            if (attr.namespaceURI !== XMLNS)
              data[uri(attr)] = text(attr.value)
          }

          for (let node of desc.children) {
            let values = Array
              .from($$('li', node), value)
              .filter(v => !blank(v))

            if (blank(values)) continue

            data[uri(node)] = text(values.join('; '))
          }
        }

        return data
      }
    } catch (error) {
      verbose(`XMP extraction failed: ${error.message}`)
      debug(error.stack)
    }
  }
}

function strip(buffer) {
  if (buffer[0] !== 60) {
    let offset = buffer.indexOf(0)
    if (offset >= 0) {
      buffer = buffer.slice(offset + 1)
    }
  }
  return buffer
}

function uri(prop) {
  return [prop.namespaceURI, prop.localName].join('')
}

function value(node) {
  // TODO parse attributes into object
  return node.textContent
}
