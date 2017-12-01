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

const alignAttrs = (align) => {
  if (align === 'left') return {} // don't render default styles
  return {
    style: `text-align:${align}`
  }
}

const align = (nodeSpec, tag) => ({
  ...nodeSpec,
  attrs: {
    ...nodeSpec.attrs,
    align: { default: 'left' },
  },
  toDOM: (node) => {
    return [tag, alignAttrs(node.attrs.align), 0]
  }
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

const textDecoMark = (markValue) => ({
  attrs: {
    style: {
      default: `text-decoration: ${markValue}`
    }
  },

  parseDOM: [{
    style: 'text-decoration',
    getAttrs(value) { return value === markValue }
  }],

  toDOM(node) {
    return ['span', node.attrs]
  }
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
        getAttrs(node) { return node.style.verticalAlign === 'super' && null }
      }
    ],

    toDOM() {
      return ['sup']
    }
  },

  subscript: {
    excludes: 'superscript',
    parseDOM: [
      { tag: 'sup' },
      {
        tag: 'span',
        getAttrs(node) { return node.style.verticalAlign === 'sub' && null }
      }
    ],

    toDOM() {
      return ['sub']
    }
  }
}

const schema = new Schema({ nodes, marks })

module.exports = {
  nodes,
  marks,
  schema
}
