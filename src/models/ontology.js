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
  },

  properties: {
    create(db, properties) {
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

  classes: {
    create(db, classes) {
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


  labels: {
    flatten: compose(
      filter(lbl => lbl['@value'] != null),
      map(lbl => [lbl['@language'] || 'en', lbl['@value']]),
      cat
    ),

    create(db, id, labels) {
      if (labels.length > 0) {
        return db.run(`
          REPLACE INTO labels (id, language, label) VAlUES ${
            labels.map(
              (_, k) => `(?0, ?${2 * k + 1}, ?${2 * k + 2})`
            ).join(', ')
          }`, into([id], ontology.labels.flatten, labels)
        )
      }
    }
  }
}

module.exports = ontology
