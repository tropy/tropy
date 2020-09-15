import { $, $$, parse } from '../dom'
import { debug, warn } from '../common/log'
import { blank } from '../common/util'
import { text, date } from '../value'
import { xml } from '../ontology'

const DATES = /(^d|D)ate(\b|[A-Z])/

export function xmp(buffer) {
  try {
    if (!blank(buffer)) {
      let input = strip(buffer).toString('utf-8')
      let doc = parse(input, 'application/xml')
      let main = $('xmpmeta', doc)
      let data = {}

      if (!main) {
        debug('no XMP meta node found')
        return
      }

      let desc = $('Description', main)

      if (desc) {
        for (let attr of desc.attributes) {
          if (attr.namespaceURI !== xml.BASE)
            data[uri(attr)] = DATES.test(attr.localName) ?
              date(attr.value) :
              text(attr.value)
        }

        for (let node of desc.children) {
          let values = Array
              .from(node.childElementCount > 0 ? $$('li', node) : [node])
              .map(value)
              .filter(v => !blank(v))

          if (blank(values)) continue

          data[uri(node)] = text(values.join('; '))
        }
      }

      return data
    }
  } catch (e) {
    warn({ stack: e.stack }, 'XMP extraction failed')
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

function uri(node) {
  return [node.namespaceURI, node.localName].join('')
}

function value(node) {
  // TODO parse attributes into object
  return node.textContent
}
