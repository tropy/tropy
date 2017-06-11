'use strict'

const { SCHEMA } = require('../constants/ontology')
const { all } = require('bluebird')

const ontology = {
  create(db) {
    return db.read(SCHEMA)
  },

  vocab: {
    async load(db) {
      const vocabs = {}

      await db.each(`
        SELECT
          vocabulary_id AS id,
          prefix,
          title,
          description,
          comment,
          see_also AS seeAlso
          FROM vocabularies
          WHERE deleted IS NULL`, (data) => {
        vocabs[data.id] = {
          ...data, classes: [], properties: []
        }
      })

      await all([
        db.each(`
          SELECT vocabulary_id AS id, property_id AS prop
            FROM properties JOIN vocabularies USING (vocabulary_id)
            WHERE deleted IS NULL`, ({ id, prop }) => {
          vocabs[id].properties.push(prop)
        }),
        db.each(`
          SELECT vocabulary_id AS id, class_id AS klass
            FROM classes JOIN vocabularies USING (vocabulary_id)
            WHERE deleted IS NULL`, ({ id, klass }) => {
          vocabs[id].classes.push(klass)
        }),
      ])

      return vocabs
    },

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
          see_also,
          deleted) VALUES (?, ?, ?, ?, ?, ?, NULL)`, [
            id, prefix, title, description, comment, seeAlso
          ]
      )
    },

    update(db, id, { prefix }) {
      return db.run(`
        UPDATE vocabularies
          SET prefix = ?
          WHERE vocabulary_id = ?`, [prefix, id]
      )
    },

    delete(db, id) {
      return db.run(`
        UPDATE vocabularies
          SET deleted = datetime("now")
          WHERE vocabulary_id = ?`, id
      )
    },

    restore(db, id) {
      return db.run(`
        UPDATE vocabularies
          SET deleted = NULL
          WHERE vocabulary_id = ?`, id
      )
    },

    prune(db) {
      return db.run(`
        DELETE
          FROM vocabularies
          WHERE deleted IS NOT NULL`
      )
    }
  },

  props: {
    async load(db) {
      const props = {}

      await db.each(`
        SELECT
          property_id AS id,
          vocabulary_id AS vocabulary,
          p.description,
          p.comment,
          label
          FROM properties p
            JOIN vocabularies v USING (vocabulary_id)
            JOIN labels ON (property_id = id)
          WHERE language = ? AND v.deleted IS NULL`, [ARGS.locale],
        (data) => {
          props[data.id] = data
        }
      )

      return props
    },

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

  types: {
    async load(db) {
      const classes = {}

      await db.each(`
        SELECT
          class_id AS id,
          vocabulary_id AS vocabulary,
          c.description,
          c.comment,
          label
          FROM classes c
            JOIN vocabularies v USING (vocabulary_id)
            JOIN labels ON (class_id = id)
          WHERE language = ? AND v.deleted IS NULL`, [ARGS.locale],
        (data) => {
          classes[data.id] = data
        }
      )

      return classes
    },

    create(db, ...classes) {
      return db.prepare(`
        REPLACE INTO classes (
          class_id,
          vocabulary_id,
          parent,
          description,
          comment) VALUES (?, ?, ?, ?, ?)`, stmt =>
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
              lbl.language || ARGS.locale,
              lbl.label
            ])
          ))
      )
    }
  }
}

module.exports = ontology
