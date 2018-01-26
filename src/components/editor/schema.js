'use strict'

const { Schema } = require('prosemirror-model')

const basic = require('prosemirror-schema-basic')
const list = require('prosemirror-schema-list')

const {
  doc,
  paragraph,
  blockquote,
  text,
  hard_break,
  horizontal_rule
} = basic.nodes

const {
  em,
  strong,
  link
} = basic.marks


const align = (nodeSpec, tag) => ({
  ...nodeSpec,
  attrs: {
    ...nodeSpec.attrs,
    align: { default: 'left' },
  },
  toDOM: (node) => ([
    tag,
    (node.attrs.align === 'left') ?  {} : {
      style: `text-align: ${node.attrs.align}`
    },
    0
  ])
})

const nodes = {
  doc,
  paragraph: align(paragraph, 'p'),
  blockquote,
  text,
  hard_break,
  horizontal_rule,

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

const marks = {
  link,
  italic: em,
  bold: strong,

  underline: textDecoMark('underline'),
  overline: textDecoMark('overline'),
  strikethrough: textDecoMark('line-through'),

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
      { tag: 'sup' },
      {
        tag: 'span',
        getAttrs: (node) => (node.style.verticalAlign === 'sub')
      }
    ],
    toDOM: () => (['sub'])
  }
}

const schema = new Schema({ nodes, marks })

module.exports = {
  nodes,
  marks,
  schema
}
