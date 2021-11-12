import { Schema } from 'prosemirror-model'
import * as basic from 'prosemirror-schema-basic'
import * as list from 'prosemirror-schema-list'

const {
  doc,
  paragraph,
  blockquote,
  text,
  hard_break,
  horizontal_rule
} = basic.nodes


const align = (nodeSpec, tag) => ({
  ...nodeSpec,
  attrs: {
    ...nodeSpec.attrs,
    align: { default: 'left' }
  },
  toDOM: (node) => ([
    tag,
    (node.attrs.align === 'left') ?  {} : {
      style: `text-align: ${node.attrs.align}`
    },
    0
  ])
})

export const nodes = {
  doc,
  paragraph: align(paragraph, 'p'),
  blockquote,
  text,
  horizontal_rule,

  hard_break: {
    ...hard_break,
    parseDOM: [{ tag: 'br' }, { tag: 'span.line-break' }],
    toDOM: () => ([
      'span', { class: 'line-break' }, ['br']
    ])
  },

  ordered_list: {
    ...list.orderedList,
    content: 'list_item+',
    group: 'block'
  },
  bullet_list: {
    ...list.bulletList,
    content: 'list_item+',
    group: 'block'
  },
  list_item: {
    ...list.listItem,
    content: 'paragraph block*'
  }
}

const textDecoMark = (deco) => ({
  attrs: {
    style: {
      default: `text-decoration: ${deco}`
    }
  },
  parseDOM: [{
    style: 'text-decoration',
    getAttrs: (value) => (value === deco)
  }],
  toDOM: (node) => (['span', node.attrs])
})

export const marks = {
  italic: basic.marks.em,
  bold: basic.marks.strong,

  underline: textDecoMark('underline'),
  overline: textDecoMark('overline'),
  strikethrough: textDecoMark('line-through'),

  link: {
    attrs: {
      href: {}
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs: (dom) => ({
          href: dom.getAttribute('href')
        })
      }
    ],
    toDOM: (node) => (['a', node.attrs, 0])
  },

  superscript: {
    excludes: 'subscript',
    parseDOM: [
      { tag: 'sup' },
      {
        tag: 'span',
        getAttrs: (node) => (node.style.verticalAlign === 'super')
      }
    ],
    toDOM: () => (['sup'])
  },

  subscript: {
    excludes: 'superscript',
    parseDOM: [
      { tag: 'sub' },
      {
        tag: 'span',
        getAttrs: (node) => (node.style.verticalAlign === 'sub')
      }
    ],
    toDOM: () => (['sub'])
  }
}

export const nodeViews = {
  link(mark) {
    let dom = document.createElement('a')

    dom.href = mark.attrs.href
    dom.title = mark.attrs.title || mark.attrs.href

    return { dom }
  }
}

export const schema = new Schema({ nodes, marks })
