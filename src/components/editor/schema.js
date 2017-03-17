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
  link,
  em,
  strong
} = basic.marks

const nodes = {
  doc,
  paragraph,
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

const marks = {
  link,
  em,
  strong,

  underline: {
    attrs: {
      style: {
        default: 'text-decoration: underline'
      }
    },

    parseDOM: [{
      style: 'text-decoration',
      getAttrs(value) { return value === 'underline' }
    }],

    toDOM(node) {
      return ['span', node.attrs]
    }
  },

  strikethrough: {
    attrs: {
      style: {
        default: 'text-decoration: line-through'
      }
    },

    parseDOM: [{
      style: 'text-decoration',
      getAttrs(value) { return value === 'line-through' }
    }],

    toDOM(node) {
      return ['span', node.attrs]
    }
  }
}

const schema = new Schema({ nodes, marks })

module.exports = {
  nodes,
  marks,
  schema
}
