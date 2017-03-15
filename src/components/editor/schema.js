'use strict'

const { Schema } = require('prosemirror-model')
const basic = require('prosemirror-schema-basic')
const list = require('prosemirror-schema-list')

const {
  doc, paragraph, blockquote, text, hard_break
} = basic.nodes

const { link, em, strong } = basic.marks

const marks = {
  underline: {
    parseDOM: [{
      style: 'text-decoration',
      getAttrs(value) { return value === 'underline' }
    }],

    toDOM() {
      return ['span', {
        style: { 'text-decoration': 'underline' }
      }]
    }
  },

  strikethrough: {
    parseDOM: [{
      style: 'text-decoration',
      getAttrs(value) { return value === 'line-through' }
    }],

    toDOM() {
      return ['span', {
        style: { 'text-decoration': 'line-through' }
      }]
    }
  }
}

const schema = new Schema({
  nodes: {
    doc,
    paragraph,
    blockquote,
    text,
    hard_break,

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
    },
  },

  marks: {
    link,
    em,
    strong,
    ...marks
  }
})

module.exports = {
  marks,
  schema
}
