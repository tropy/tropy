'use strict'

const assert = require('assert')
const { SCHEMA } = require('../constants/ontology')
const { TEXT } = require('../constants/type')
const { all } = require('bluebird')
const { list, quote } = require('../common/util')

const ontology = {
  create(db) {
    return db.read(SCHEMA)
  },

  clear(db) {
    return db.exec(`
      DELETE FROM vocabularies;
      DELETE FROM templates;
      DELETE FROM labels;`)
  },

  vocab: {
    async load(db, ...args) {
      const vocabs = {}
      const cond = ['deleted is NULL']

      if (args.length > 0) {
        cond.push(`vocabulary_id IN (${list(args, quote)})`)
      }

      await db.each(`
        SELECT
            vocabulary_id AS id,
            prefix,
            title,
            description,
            comment,
            see_also AS seeAlso,
            protected AS isProtected
          FROM vocabularies
          WHERE ${cond.join(' AND ')}`, (data) => {
        vocabs[data.id] = {
          ...data,
          isProtected: !!data.isProtected,
          classes: [],
          datatypes: [],
          properties: []
        }
      })

      await all([
        db.each(`
          SELECT vocabulary_id AS id, property_id AS prop
            FROM properties JOIN vocabularies USING (vocabulary_id)
            WHERE ${cond.join(' AND ')}`, ({ id, prop }) => {
          vocabs[id].properties.push(prop)
        }),
        db.each(`
          SELECT vocabulary_id AS id, class_id AS klass
            FROM classes JOIN vocabularies USING (vocabulary_id)
            WHERE ${cond.join(' AND ')}`, ({ id, klass }) => {
          vocabs[id].classes.push(klass)
        }),
        db.each(`
          SELECT vocabulary_id AS id, datatype_id AS datatype
            FROM datatypes JOIN vocabularies USING (vocabulary_id)
            WHERE ${cond.join(' AND ')}`, ({ id, datatype }) => {
          vocabs[id].datatypes.push(datatype)
        })
      ])

      return vocabs
    },

    async create(db, {
      id,
      prefix,
      title,
      description,
      comment,
      seeAlso,
      isProtected
    }) {
      if (prefix === '') prefix = null

      const ex = await db.get(`
        SELECT vocabulary_id AS id, protected AS isProtected
          FROM vocabularies
          WHERE vocabulary_id = ?`, id)

      if (ex != null) {
        assert(!ex.isProtected, 'vocabulary is protected')
        return ontology.vocab.restore(db, id)
      }

      return db.run(`
        INSERT INTO vocabularies (
          vocabulary_id,
          prefix,
          title,
          description,
          comment,
          see_also,
          protected) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            id, prefix, title, description, comment, seeAlso, !!isProtected
          ]
      )
    },

    update(db, { id, prefix }) {
      if (prefix === '') prefix = null

      return db.run(`
        UPDATE vocabularies
          SET prefix = ?, deleted = NULL
          WHERE vocabulary_id = ?`, [prefix, id]
      )
    },

    delete(db, id) {
      return db.run(`
        UPDATE vocabularies
          SET deleted = datetime("now")
          WHERE vocabulary_id = ? AND NOT protected`, id
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
    async load(db, ...args) {
      const props = {}
      const cond = [
        '(language = ? OR language IS NULL)', 'deleted is NULL'
      ]

      if (args.length > 0) {
        cond.push(`vocabulary_id IN (${list(args, quote)})`)
      }

      await db.each(`
        SELECT
          property_id AS id,
          vocabulary_id AS vocabulary,
          p.description,
          p.comment,
          label
          FROM properties p
            JOIN vocabularies v USING (vocabulary_id)
            LEFT JOIN labels ON (property_id = id)
          WHERE ${cond.join(' AND ')}`, [ARGS.locale],
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

  class: {
    async load(db, ...args) {
      const classes = {}
      const cond = [
        '(language = ? OR language IS NULL)', 'deleted is NULL'
      ]

      if (args.length > 0) {
        cond.push(`vocabulary_id IN (${list(args, quote)})`)
      }

      await db.each(`
        SELECT
          class_id AS id,
          vocabulary_id AS vocabulary,
          c.description,
          c.comment,
          label
          FROM classes c
            JOIN vocabularies v USING (vocabulary_id)
            LEFT JOIN labels ON (class_id = id)
          WHERE ${cond.join(' AND ')}`, [ARGS.locale],
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

  type: {
    async load(db, ...args) {
      const types = {}
      const cond = [
        '(language = ? OR language IS NULL)', 'deleted is NULL'
      ]

      if (args.length > 0) {
        cond.push(`vocabulary_id IN (${list(args, quote)})`)
      }

      await db.each(`
        SELECT
          datatype_id AS id,
          vocabulary_id AS vocabulary,
          dt.description,
          dt.comment,
          label
          FROM datatypes dt
            JOIN vocabularies v USING (vocabulary_id)
            LEFT OUTER JOIN labels ON (datatype_id = id)
          WHERE ${cond.join(' AND ')}`, [ARGS.locale],
        (data) => {
          types[data.id] = data
        }
      )

      return types
    },

    create(db, ...types) {
      return db.prepare(`
        REPLACE INTO datatypes (
          datatype_id,
          vocabulary_id,
          description,
          comment) VALUES (?, ?, ?, ?)`, stmt =>
            all(types.map(dt => stmt.run([
              dt.id,
              dt.vocabulary,
              dt.description,
              dt.comment
            ])
          ))
      )
    }
  },

  label: {
    save(db, ...labels) {
      return db.prepare(`
        REPLACE INTO labels (id, language, label)
          VALUES (?, ?, ?)`, stmt =>
            all(labels.map(lbl => stmt.run([
              lbl.id,
              lbl.language || ARGS.locale,
              lbl.label
            ])
          ))
      )
    },

    prune(db) {
      return db.run(`
        DELETE
          FROM labels
          WHERE id NOT IN (SELECT class_id FROM classes)
            AND id NOT IN (SELECT datatype_id FROM datatypes)
            AND id NOT IN (SELECT property_id FROM properties)`
      )
    }
  },

  template: {
    async load(db, ...ids) {
      const temps = {}

      const constraint = (ids.length > 0) ? `
          WHERE template_id IN (${list(ids, quote)})` : ''

      await db.each(`
        SELECT
            template_id AS id,
            template_type AS type,
            name,
            creator,
            description,
            protected AS isProtected,
            created
          FROM templates${constraint}`, (data) => {
        temps[data.id] = {
          ...data, isProtected: !!data.isProtected, domain: [], fields: []
        }
      })

      await all([
        db.each(`
          SELECT class_id AS klass, template_id AS tpl
            FROM domains${constraint}
            ORDER BY position`, ({ tpl, klass }) => {
          temps[tpl].domain.push(klass)
        }),
        db.each(`
          SELECT
              field_id AS id,
              template_id AS tpl,
              property_id AS property,
              datatype_id AS datatype,
              required AS isRequired,
              hint,
              constant
            FROM fields${constraint}
            ORDER BY position, field_id`,
          ({ tpl, isRequired, ...data }) => {
            temps[tpl].fields.push({
              ...data,
              isRequired: !!isRequired
            })
          })
      ])

      return temps
    },

    create(db, { id, type, name, creator, description, isProtected }) {
      return db.run(`
        INSERT INTO templates (
            template_id,
            template_type,
            name,
            creator,
            description,
            protected)
          VALUES (?, ?, ?, ?, ?, ?)`,
        [id, type, name, creator, description, !!isProtected]
      )
    },

    delete(db, ...ids) {
      return db.run(`
        DELETE FROM templates
          WHERE template_id IN (${list(ids, quote)}) AND NOT protected`
      )
    },

    save(db, { id, ...data }) {
      const assign = []
      const params = { $id: id }

      for (let attr in data) {
        assign.push(`${attr} = $${attr}`)
        params[`$${attr}`] = data[attr]
      }

      assert(id != null, 'missing tag id')
      assert(assign.length > 0, 'missing assignments')

      return db.run(`
        UPDATE templates
          SET ${assign.join(', ')}, modified = datetime("now")
          WHERE template_id = $id`, params)
    },

    field: {
      add(db, id, ...fields) {
        return db.prepare(`
          INSERT INTO fields (
              template_id,
              property_id,
              datatype_id,
              required,
              hint,
              constant,
              position
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`, stmt =>
            all(fields.map((f, idx) => stmt.run([
              id,
              f.property,
              f.datatype || TEXT,
              !!f.isRequired,
              f.hint,
              f.constant,
              (f.position != null) ? f.position : idx
            ])
          ))
        )
      },

      remove(db, id, ...fields) {
        return db.run(`
          DELETE FROM fields
            WHERE template_id = ? AND field_id IN (${list(fields)})`, id)
      },

      save(db, { id, ...data }) {
        const assign = []
        const params = { $id: id }

        for (let attr in data) {
          assign.push(`${COL.FIELD[attr] || attr} = $${attr}`)
          params[`$${attr}`] = data[attr]
        }

        assert(id != null, 'missing field id')
        assert(assign.length > 0, 'missing assignments')

        return db.run(`
          UPDATE fields
            SET ${assign.join(', ')}
            WHERE field_id = $id`, params)
      },

      order(db, id, order) {
        return db.run(`
          UPDATE fields
            SET position = CASE field_id
              ${order.map((_, idx) => (`WHEN ? THEN ${idx + 1}`)).join(' ')}
              END
            WHERE template_id = ?`,
          ...order, id)
      }
    }
  },
}

const COL = {
  FIELD: {
    property: 'property_id',
    datatype: 'datatype_id',
    isRequired: 'required'
  }
}

module.exports = ontology
