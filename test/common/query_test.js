'use strict'

describe('Query Builder', () => {
  const query = __require('common/query')

  describe('Select', () => {
    const { select } = query

    it('empty', () =>
      expect(select().SELECT).to.eql('SELECT *'))

    it('simple', () =>
      expect(select('a').SELECT).to.eql('SELECT a'))

    it('multiple', () =>
      expect(select('a').select('b').query).to.match(/^SELECT a, b/))

    it('alias', () => {
      expect(select({ a: 'a', foo: 'b' }).query)
        .to.match(/SELECT a, b AS foo/)
      expect(select('a', { b: 'c' }, 'd').query)
        .to.match(/SELECT a, c AS b, d/)
    })

    it('distinct', () =>
      expect(select('a').distinct.query).to.match(/SELECT DISTINCT a/))

    it('scoped', () => {
      expect(select('t.a', { c: 't.b' }, 't.*').query)
        .to.match(/^SELECT t\.a, t\.b AS c, t\.\*/)
    })

    it('sources', () =>
      expect(select('a').from('b').query).to.match(/SELECT a FROM b/))

    it('order', () => {
      expect(
        select('a', 'b')
          .from('cd')
          .order('b')
          .order('a', 'DESC')
          .query
      ).to.match(/SELECT a, b FROM cd ORDER BY b, a DESC/)
    })

    it('null', () => {
      let q = select()

      q.where({ a: null })
      expect(q.WHERE).to.eql('WHERE a IS NULL')

      q.not.where({ a: null })
      expect(q.WHERE).to.eql('WHERE a IS NULL AND a IS NOT NULL')
    })

    it('lists', () => {
      expect(select().where({ a: [1, 2, 3] }).WHERE)
        .to.eql('WHERE a IN (1, 2, 3)')

      expect(select().unless({ a: [1, 2, 3] }).WHERE)
        .to.eql('WHERE a NOT IN (1, 2, 3)')
    })

    it('params', () => {
      let q = select().where({ a: 1, b: null, c: 'foo' })

      expect(q.WHERE).to.eql('WHERE a = $a AND b IS NULL AND c = $c')
      expect(q.params).to.eql({ $a: 1, $c: 'foo' })
    })

    it('join', () => {
      expect(
        select('a')
        .from('b')
        .join('c', { using: 'a' })
        .outer.join('d')
        .query
      ).to.eql('SELECT a FROM b JOIN c USING (a) LEFT OUTER JOIN d')

      let q = select('*').from('a').join('b', { on: { x: 23 } })
      expect(q.query).to.eql('SELECT * FROM a JOIN b ON (x = $x)')
      expect(q.params).to.have.property('$x', 23)
    })
  })

  describe('Update', () => {
    const { update } = query

    it('simple', () =>
      expect(
        update('project')
          .set({ name: 'Tropy' })
          .query
      ).to.eql('UPDATE project SET name = $new_name'))

    it('null', () =>
      expect(
        update('project')
          .set({ base: null })
          .query
      ).to.eql('UPDATE project SET base = NULL'))

    it('set strings', () =>
      expect(
        update('project')
          .set({ base: null })
          .set('modified = datetime("now")')
          .query
      ).to.eql('UPDATE project SET base = NULL, modified = datetime("now")'))

    it('conditional', () => {
      let q = update('project').set({ name: 'new' }).where({ name: 'old' })

      expect(q.query)
        .to.eql('UPDATE project SET name = $new_name WHERE name = $name')
      expect(q.params)
        .to.eql({ $name: 'old', $new_name: 'new' })
    })

    it('multiple', () =>
      expect(
        update('project')
          .set({ name: 'Tropy', base: 'project' })
          .query
      ).to.eql('UPDATE project SET name = $new_name, base = $new_base'))

    it('lists', () =>
      expect(
        update('list_items')
          .set('mod = datetime("now")')
          .where({ id: [1, 2, 3] })
          .query
      ).to.eql(
        'UPDATE list_items SET mod = datetime("now") WHERE id IN (1, 2, 3)'
      ))

    it('filtered', () =>
      expect(
        update('project')
          .set({ name: 'Tropy' }, { filters: { name: x => `lower(${x})` } })
          .query
      ).to.eql('UPDATE project SET name = lower($new_name)'))
  })

  describe('Insert', () => {
    const { into } = query

    it('simple', () =>
      expect([
        ...into('photos').insert({ id: 23, mimetype: 'image/jpeg' })
      ]).to.eql([
        'INSERT INTO photos (id, mimetype) VALUES (?,?)', [23, 'image/jpeg']
      ]))
  })
})
