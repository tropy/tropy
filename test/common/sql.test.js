import sql, { IN, SET, VALUES } from '#tropy/common/sql.js'

describe('sql', () => {
  it('binds interpolated values', () => {
    expect(sql`SELECT * FROM t WHERE a = ${1} AND b = ${'x'} AND c IS ${undefined}`)
      .to.include({ text: 'SELECT * FROM t WHERE a = ? AND b = ? AND c IS ?' })
      .and.have.deep.property('params', [1, 'x', null])
  })

  it('binds arrays as JSON', () => {
    expect(sql`FROM json_each(${[1, 2]})`)
      .to.include({ text: 'FROM json_each(?)' })
      .and.have.deep.property('params', ['[1,2]'])
  })

  it('builds IN lists via json_each', () => {
    expect(sql`id ${IN([1, 2])}`)
      .to.include({ text: 'id IN (SELECT value FROM json_each(?))' })
      .and.have.deep.property('params', ['[1,2]'])
  })

  it('splices fragments with their params in order', () => {
    let since = '-1 day'
    let q = sql`SELECT id FROM t WHERE a = ${1}${
      since ? sql` AND d < datetime('now', ${since})` : sql``
    } AND b = ${2}`

    expect(q.text).to.equal(
      'SELECT id FROM t WHERE a = ? AND d < datetime(\'now\', ?) AND b = ?')
    expect(q.params).to.eql([1, since, 2])
  })

  it('quotes identifiers and passes raw text', () => {
    expect(sql`SELECT ${sql.id('a"b')} FROM ${sql.raw('t')}`.text)
      .to.equal('SELECT "a""b" FROM t')
  })

  it('builds assignments and values from defined properties', () => {
    let data = { name: 'x', color: null, age: undefined }

    expect(sql`UPDATE t ${SET(data)} WHERE id = ${1}`)
      .to.include({ text: 'UPDATE t SET "name" = ?, "color" = ? WHERE id = ?' })
      .and.have.deep.property('params', ['x', null, 1])

    expect(sql`INSERT INTO t ${VALUES(data)}`)
      .to.include({ text: 'INSERT INTO t ("name", "color") VALUES (?, ?)' })
      .and.have.deep.property('params', ['x', null])
  })

  it('interpolates property values like the tag', () => {
    expect(SET({ a: [1], b: sql`datetime('now')` }))
      .to.include({ text: 'SET "a" = ?, "b" = datetime(\'now\')' })
      .and.have.deep.property('params', ['[1]'])
  })

  it('rejects empty assignments and values', () => {
    expect(() => SET({ a: undefined })).to.throw()
    expect(() => VALUES({})).to.throw()
  })
})
