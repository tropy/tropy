'use strict'

const assert = require('assert')
const { SCHEMA } = require('../constants/ontology')
const { TEXT } = require('../constants/type')
const { all } = require('bluebird')
const { blank, list, quote } = require('../common/util')

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
      const cond = ['deleted is NULL']

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
            LEFT JOIN labels ON (property_id = id AND language = ?)
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
      const cond = ['deleted is NULL']

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
            LEFT JOIN labels ON (class_id = id AND language = ?)
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
      const cond = ['deleted is NULL']

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
            LEFT OUTER JOIN labels ON (datatype_id = id AND language = ?)
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
      const cons = (ids.length > 0) ?
        `template_id IN (${list(ids, quote)})` : null

      await db.each(`
        SELECT
            template_id AS id,
            template_type AS type,
            name,
            version,
            creator,
            description,
            protected AS isProtected,
            created
          FROM templates
          ${cons == null ? '' : `WHERE ${cons}`}`, (data) => {
        temps[data.id] = {
          ...data, isProtected: !!data.isProtected, domain: [], fields: []
        }
      })

      await all([
        db.each(`
          SELECT class_id AS klass, template_id AS tpl
            FROM domains
            ${cons == null ? '' : `WHERE ${cons}`}
            ORDER BY position`, ({ tpl, klass }) => {
          temps[tpl].domain.push(klass)
        }),
        db.each(`
          SELECT
              f.field_id AS id,
              template_id AS tpl,
              property_id AS property,
              label,
              datatype_id AS datatype,
              required AS isRequired,
              hint,
              value,
              constant AS isConstant
            FROM fields f
              LEFT OUTER JOIN field_labels l
                ON (f.field_id = l.field_id AND language = ?)
            ${cons == null ? '' : `WHERE ${cons}`}
            ORDER BY position, f.field_id`, ARGS.locale,
          ({ tpl, isRequired, isConstant, ...data }) => {
            temps[tpl].fields.push({
              ...data,
              isConstant: !!isConstant,
              isRequired: !!isRequired
            })
          })
      ])

      return temps
    },

    async create(db, {
      id,
      type,
      name,
      version,
      creator,
      description,
      isProtected
    }, { replace } = {}) {
      if (replace) {
        db.run(`
          DELETE FROM templates WHERE template_id = ?`, id)
      }

      return db.run(`
        INSERT INTO templates (
            template_id,
            template_type,
            name,
            version,
            creator,
            description,
            protected)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, type, name, version, creator, description, !!isProtected]
      )
    },

    async stale(db, { id, date }) {
      return null == await db.get(`
        SELECT template_id AS id, created, protected  AS isProtected
          FROM TEMPLATES
          WHERE template_id = ? AND created >= date(?)`, id, date)
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
        const hasId = (fields[0].id != null)

        return db.prepare(`
          INSERT INTO fields (
              ${hasId ? 'field_id,\n' : ''}
              template_id,
              property_id,
              datatype_id,
              required,
              hint,
              value,
              constant,
              position
            ) VALUES (
              ${hasId ? '$id,\n' : ''}
              $template,
              $property,
              $datatype,
              $isRequired,
              $hint,
              $value,
              $isConstant,
              $position
            )`, stmt =>
            all(fields.map((f, idx) => stmt.run({
              $id: f.id,
              $template: id,
              $property: f.property,
              $datatype: f.datatype || TEXT,
              $isRequired: !!f.isRequired,
              $hint: f.hint,
              $value: f.value,
              $isConstant: !!f.isConstant,
              $position: (f.position != null) ? f.position : idx
            })
          ))
        ).then(res =>
          db.prepare(`
            INSERT INTO field_labels (field_id, language, label)
              VALUES (?,?,?)`, addLabel =>
                all(res.map((f, idx) => blank(fields[idx].label) ?
                  null :
                  addLabel.run([f.id, ARGS.locale, fields[idx].label])))
          ).then(() => res)
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
      },

      label: {
        save(db, { id, label }, language = ARGS.locale) {
          if (blank(label)) {
            return db.run(`
              DELETE FROM field_labels
                WHERE field_id = ? AND language = ?`, [id, language])
          }

          return db.run(`
            REPLACE INTO field_labels (field_id, language, label)
              VALUES (?,?,?)`, [id, language, label])
        }
      }
    }
  },
}

const COL = {
  FIELD: {
    property: 'property_id',
    datatype: 'datatype_id',
    isConstant: 'constant',
    isRequired: 'required'
  }
}

module.exports = ontology
