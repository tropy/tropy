import assert from 'node:assert'
import { join } from 'node:path'
import ARGS from '../args.js'
import { TYPE } from '../constants/index.js'
import { blank } from '../common/util.js'
import { sql } from '../common/sql.js'

const byVocabulary = (ids) => (ids.length > 0) ?
  sql`deleted IS NULL AND vocabulary_id IN ${sql.list(ids)}` :
  sql`deleted IS NULL`

const ontology = {
  create (db) {
    return db.read(join(ARGS.app, 'db', 'schema', 'ontology.sql'))
  },

  clear (db) {
    return db.exec(`
      DELETE FROM vocabularies;
      DELETE FROM templates;
      DELETE FROM labels;`)
  },

  vocab: {
    async load (db, ...args) {
      const vocabs = {}
      const cond = byVocabulary(args)

      await db.each(sql`
        SELECT
            vocabulary_id AS id,
            prefix,
            title,
            description,
            comment,
            see_also AS seeAlso,
            protected AS isProtected
          FROM vocabularies
          WHERE ${cond}`, (data) => {
        vocabs[data.id] = {
          ...data,
          isProtected: !!data.isProtected,
          classes: [],
          datatypes: [],
          properties: []
        }
      })

      await Promise.all([
        db.each(sql`
          SELECT vocabulary_id AS id, property_id AS prop
            FROM properties JOIN vocabularies USING (vocabulary_id)
            WHERE ${cond}`, ({ id, prop }) => {
          vocabs[id].properties.push(prop)
        }),
        db.each(sql`
          SELECT vocabulary_id AS id, class_id AS klass
            FROM classes JOIN vocabularies USING (vocabulary_id)
            WHERE ${cond}`, ({ id, klass }) => {
          vocabs[id].classes.push(klass)
        }),
        db.each(sql`
          SELECT vocabulary_id AS id, datatype_id AS datatype
            FROM datatypes JOIN vocabularies USING (vocabulary_id)
            WHERE ${cond}`, ({ id, datatype }) => {
          vocabs[id].datatypes.push(datatype)
        })
      ])

      return vocabs
    },

    async create (db, {
      id,
      prefix,
      title,
      description,
      comment,
      created = (new Date).toISOString(),
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
          created,
          see_also,
          protected) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        id,
        prefix,
        title,
        description,
        comment,
        created,
        seeAlso,
        !!isProtected
      ]
      )
    },

    update (db, { id, prefix }) {
      if (prefix === '') prefix = null

      return db.run(`
        UPDATE vocabularies
          SET prefix = ?, deleted = NULL
          WHERE vocabulary_id = ?`, [prefix, id]
      )
    },

    delete (db, id) {
      return db.run(`
        UPDATE vocabularies
          SET deleted = datetime('now')
          WHERE vocabulary_id = ? AND NOT protected`, id
      )
    },

    restore (db, id) {
      return db.run(`
        UPDATE vocabularies
          SET deleted = NULL
          WHERE vocabulary_id = ?`, id
      )
    },

    prune (db) {
      return db.run(`
        DELETE
          FROM vocabularies
          WHERE deleted IS NOT NULL`
      )
    }
  },

  props: {
    async load (db, ...args) {
      const props = {}

      await db.each(sql`
        SELECT
          property_id AS id,
          vocabulary_id AS vocabulary,
          p.description,
          p.comment,
          label
          FROM properties p
            JOIN vocabularies v USING (vocabulary_id)
            LEFT JOIN labels ON (property_id = id AND language = ${ARGS.locale})
          WHERE ${byVocabulary(args)}`,
      (data) => {
        props[data.id] = data
      }
      )

      return props
    },

    async create (db, ...properties) {
      for (let p of properties) {
        await db.run(`
          REPLACE INTO properties (
            property_id,
            vocabulary_id,
            domain,
            range,
            parent,
            description,
            comment) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
          p.id,
          p.vocabulary,
          p.domain,
          p.range,
          p.parent,
          p.description,
          p.comment
        ])
      }
    }
  },

  class: {
    async load (db, ...args) {
      const classes = {}

      await db.each(sql`
        SELECT
          class_id AS id,
          vocabulary_id AS vocabulary,
          c.description,
          c.comment,
          label
          FROM classes c
            JOIN vocabularies v USING (vocabulary_id)
            LEFT JOIN labels ON (class_id = id AND language = ${ARGS.locale})
          WHERE ${byVocabulary(args)}`,
      (data) => {
        classes[data.id] = data
      }
      )

      return classes
    },

    async create (db, ...classes) {
      for (let c of classes) {
        await db.run(`
          REPLACE INTO classes (
            class_id,
            vocabulary_id,
            parent,
            description,
            comment) VALUES (?, ?, ?, ?, ?)`, [
          c.id,
          c.vocabulary,
          c.parent,
          c.description,
          c.comment
        ])
      }
    }
  },

  type: {
    async load (db, ...args) {
      const types = {}

      await db.each(sql`
        SELECT
          datatype_id AS id,
          vocabulary_id AS vocabulary,
          dt.description,
          dt.comment,
          label
          FROM datatypes dt
            JOIN vocabularies v USING (vocabulary_id)
            LEFT OUTER JOIN labels ON (datatype_id = id AND language = ${ARGS.locale})
          WHERE ${byVocabulary(args)}`,
      (data) => {
        types[data.id] = data
      }
      )

      return types
    },

    async create (db, ...types) {
      for (let dt of types) {
        await db.run(`
          REPLACE INTO datatypes (
            datatype_id,
            vocabulary_id,
            description,
            comment) VALUES (?, ?, ?, ?)`, [
          dt.id,
          dt.vocabulary,
          dt.description,
          dt.comment
        ])
      }
    }
  },

  label: {
    async save (db, ...labels) {
      for (let lbl of labels) {
        await db.run(`
          REPLACE INTO labels (id, language, label)
            VALUES (?, ?, ?)`, [
          lbl.id,
          lbl.language || ARGS.locale,
          lbl.label
        ])
      }
    },

    prune (db) {
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
    async load (db, ...ids) {
      const temps = {}
      const where = (ids.length > 0) ?
        sql`WHERE template_id IN ${sql.list(ids)}` : sql``

      await db.each(sql`
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
          ${where}`, (data) => {
        temps[data.id] = {
          ...data, isProtected: !!data.isProtected, domain: [], fields: []
        }
      })

      await Promise.all([
        db.each(sql`
          SELECT class_id AS klass, template_id AS tpl
            FROM domains
            ${where}
            ORDER BY position`, ({ tpl, klass }) => {
          temps[tpl].domain.push(klass)
        }),
        db.each(sql`
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
                ON (f.field_id = l.field_id AND language = ${ARGS.locale})
            ${where}
            ORDER BY position, f.field_id`,
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

    async create (db, {
      id,
      type,
      name,
      version,
      created = (new Date).toISOString(),
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
            created,
            modified,
            creator,
            description,
            protected)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        id,
        type,
        name,
        version,
        created,
        created,
        creator,
        description,
        !!isProtected]
      )
    },

    async stale (db, { id, date }) {
      return null == await db.get(`
        SELECT template_id AS id, created, protected  AS isProtected
          FROM TEMPLATES
          WHERE template_id = ? AND created >= date(?)`, id, date)
    },

    delete (db, ...ids) {
      return db.run(sql`
        DELETE FROM templates
          WHERE template_id IN ${sql.list(ids)}
            AND NOT protected`)
    },

    save (db, { id, ...data }) {
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
          SET ${assign.join(', ')}, modified = datetime('now')
          WHERE template_id = $id`, params)
    },

    field: {
      async add (db, id, ...fields) {
        const hasId = (fields[0].id != null)
        const res = []

        for (let [idx, f] of fields.entries()) {
          let field = await db.run(sql`
            INSERT INTO fields (
                ${hasId ? sql`field_id,` : sql``}
                template_id,
                property_id,
                datatype_id,
                required,
                hint,
                value,
                constant,
                position
              ) VALUES (
                ${hasId ? sql`${f.id},` : sql``}
                ${id},
                ${f.property},
                ${f.datatype || TYPE.TEXT},
                ${!!f.isRequired},
                ${f.hint},
                ${f.value},
                ${!!f.isConstant},
                ${f.position ?? idx}
              )`)

          if (!blank(f.label)) {
            await db.run(`
              INSERT INTO field_labels (field_id, language, label)
                VALUES (?,?,?)`, [field.id, ARGS.locale, f.label])
          }

          res.push(field)
        }

        return res
      },

      remove (db, id, ...fields) {
        return db.run(sql`
          DELETE FROM fields
            WHERE template_id = ${id}
              AND field_id IN ${sql.list(fields)}`)
      },

      save (db, { id, ...data }) {
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

      order (db, id, order) {
        return db.run(sql`
          UPDATE fields
            SET position = o.key + 1
            FROM json_each(${order}) AS o
            WHERE fields.field_id = o.value AND template_id = ${id}`)
      },

      label: {
        save (db, { id, label }, language = ARGS.locale) {
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
  }
}

const COL = {
  FIELD: {
    property: 'property_id',
    datatype: 'datatype_id',
    isConstant: 'constant',
    isRequired: 'required'
  }
}

export default ontology
