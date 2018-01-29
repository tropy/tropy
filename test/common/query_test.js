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
          .from('b')
          .order('b')
          .order('a', 'DESC')
          .query
      ).to.match(/SELECT a, b FROM b ORDER BY b, a DESC/)
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
        .join('d', { outer: true })
        .query
      ).to.eql('SELECT a FROM b JOIN c USING (a) LEFT OUTER JOIN d')
    })

  })
})
