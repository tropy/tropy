'use strict'

const { SCHEMA } = require('../constants/ontology')
const { compose, into, map, cat, filter } = require('transducers.js')
const { all } = Promise

const ontology = {
  create(db) {
    return db.read(SCHEMA)
  },

  vocab: {
    create(db, {
      id,
      prefix,
      title,
      description,
      comment,
      seeAlso
    }) {
      return db.run(`
        REPLACE INTO vocabularies (
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
  },

  props: {
    create(db, ...properties) {
      return db.prepare(`
        REPLACE INTO properties (
          property_id,
          vocabulary_id,
          domain,
          range,
          parent,
          description,
          comment) VALUES (?, ?, ?, ?, ?, ?, ?)`, stmt =>
            all(properties.map(p => stmt.run([
              p.id,
              p.vocabulary,
              p.domain,
              p.range,
              p.parent,
              p.description,
              p.comment
            ])
          ))
      )
    }
  },

  class: {
    create(db, ...classes) {
      return db.prepare(`
        REPLACE INTO classes (
          class_id,
          vocabulary_id,
          parent,
          description,
          comment) VALUES (?, ?, ?, ?, ?, ?, ?)`, stmt =>
            all(classes.map(c => stmt.run([
              c.id,
              c.vocabulary,
              c.parent,
              c.description,
              c.comment
            ])
          ))
      )
    }
  },


  label: {
    create(db, ...labels) {
      return db.prepare(`
        INSERT OR IGNORE INTO labels (id, language, label)
          VALUES (?, ?, ?)`, stmt =>
            all(labels.map(lbl => stmt.run([
              lbl.id,
              lbl.language || 'en',
              lbl.label
            ])
          ))
      )
    }
  }
}

module.exports = ontology
