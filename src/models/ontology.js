'use strict'

const { SCHEMA } = require('../constants/ontology')
const { compose, into, map, cat, filter } = require('transducers.js')

const vocab = {
  create(db, {
    id,
    prefix,
    title,
    description,
    comment,
    seeAlso
  }) {
    return db.run(`
      INSERT INTO vocabularies (
        vocabulary_id,
        prefix,
        title,
        description,
        comment,
        see_also) VALUES (?, ?, ?, ?, ?, ?)`, [
          id, prefix, title, description, comment, seeAlso
        ]
    )
  }
}


const props = {
  create(db, {
    id,
    vocabulary,
    domain,
    range,
    parent,
    description,
    comment
  }) {
    return  db.run(`
      INSERT INTO properties (
        property_id,
        vocabulary_id,
        domain,
        range,
        parent,
        description,
        comment) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
          id, vocabulary, domain, range, parent, description, comment
        ]
    )
  }
}

const classes = {
  create(db, { id, vocabulary, parent, description, comment }) {
    return  db.run(`
      INSERT INTO classes
          (class_id, vocabulary_id, parent, description, comment)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [
          id, vocabulary, parent, description, comment
        ]
    )
  }
}


const label = {
  flatten: compose(
    filter(lbl => lbl['@value'] != null),
    map(lbl => [lbl['@language'] || 'en', lbl['@value']]),
    cat
  ),

  create(db, id, labels) {
    if (labels.length > 0) {
      return db.run(`
        REPLACE INTO labels (id, language, label) VAlUES ${
          labels.map((_, k) => `(?0, ?${2 * k + 1}, ?${2 * k + 2})`).join(', ')
        }`, into([id], label.flatten, labels)
      )
    }
  }
}

module.exports = {
  create(db) {
    return db.read(SCHEMA)
  },

  classes,
  label,
  props,
  vocab
}
