import { DOMParser, DOMSerializer } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'
import { defaultMarkdownSerializer } from 'prosemirror-markdown'
import { schema } from './schema.js'
import { warn } from '../common/log.js'

const serializer = DOMSerializer.fromSchema(schema)
const parser = DOMParser.fromSchema(schema)

Object.assign(defaultMarkdownSerializer.marks, {
  bold: defaultMarkdownSerializer.marks.strong,
  italic: defaultMarkdownSerializer.marks.em,
  underline: {
    open: '__', close: '__', mixable: true, expelEnclosingWhitespace: true
  },
  overline: {
    open: '^^', close: '^^', mixable: true, expelEnclosingWhitespace: true
  },
  strikethrough: {
    open: '~~', close: '~~', mixable: true, expelEnclosingWhitespace: true
  },
  superscript: {
    open: '^', close: '^', mixable: true, expelEnclosingWhitespace: true
  },
  subscript: {
    open: '~', close: '~', mixable: true, expelEnclosingWhitespace: true
  }
})

export function serialize(note, {
  format = { text: true, html: true },
  localize = true
} = {}) {
  return (note == null) ? null :
    Object
      .entries(format)
      .reduce((acc, [fmt, include]) => {
        if (include) {
          switch (fmt) {
            case 'text':
              acc.text = toValue(note.text, localize, note.language)
              break
            case 'html':
              acc.html = toValue(
                toHTML(note.state.doc),
                localize,
                note.language)
              break
            case 'markdown':
              acc.markdown = toValue(
                toMarkdown(note.state.doc),
                localize,
                note.language)
              break
          }
        }
        return acc
      }, {})
}


const toValue = (value, localize, language) => (
  (localize && language) ?
    { '@value': value, '@language': language } :
    value
)

export function fromHTML(html) {
  let dom = (new window.DOMParser).parseFromString(html, 'text/html')
  let doc = parser.parse(dom)
  let text = doc.textBetween(0, doc.content.size, ' ', ' ')

  return {
    state: EditorState.create({ schema, doc }).toJSON(),
    text
  }
}

export function toHTML(doc) {
  try {
    let node = schema.nodeFromJSON(doc)
    let frag = serializer.serializeFragment(node)

    return Array
      .from(frag.children, el => el.outerHTML)
      .join('')

  } catch (e) {
    warn({ stack: e.stack }, 'failed to convert doc to HTML')
    return ''
  }
}

export function toMarkdown(doc) {
  try {
    let node = schema.nodeFromJSON(doc)
    return defaultMarkdownSerializer.serialize(node)

  } catch (e) {
    warn({ stack: e.stack }, 'failed to convert doc to markdown')
    return ''
  }
}
