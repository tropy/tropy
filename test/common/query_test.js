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
        .to.match(/SELECT a, foo AS b/)
      expect(select('a', { b: 'c' }, 'd').query)
        .to.match(/SELECT a, b AS c, d/)
    })

    it('distinct', () =>
      expect(select('a').distinct.query).to.match(/SELECT DISTINCT a/))

    it('scoped', () => {
      expect(select('t.a', { 't.b': 'c' }, 't.*').query)
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

    it('params', () => {
      let q = select()

      q.where({ a: null })
      expect(select().where({ a: null }).WHERE).to.eql('WHERE a IS NULL')

      q.not.where({ a: null })
      expect(q.WHERE).to.eql('WHERE a IS NULL AND a IS NOT NULL')
    })

  })
})
