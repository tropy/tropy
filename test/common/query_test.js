'use strict'

describe('Query Generator', () => {
  const query = __require('common/query')

  describe('Select', () => {
    const { select } = query

    it('simple', () => {
      expect(select('a').query).to.eql('SELECT a')
    })

    it('multiple', () => {
      expect(select('a').select('b').query).to.eql('SELECT a, b')
    })

    it('alias', () => {
      expect(select({ a: 'a', foo: 'b' }).query).to.eql('SELECT a, foo AS b')
    })

    it('distinct', () => {
      expect(select('a').distinct().query).to.eql('SELECT DISTINCT a')
    })
  })
})
