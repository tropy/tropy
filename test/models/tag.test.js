import assert from 'node:assert/strict'
import { mkprojtmp } from '../support/project.js'
import tag from '#tropy/models/tag.js'

describe('models/tag', () => {
  let tpy = mkprojtmp('tag.tpy', { name: 'Tags' })

  it('creates and saves tags', async () => {
    let { db } = tpy.current

    let a = await tag.create(db, { name: 'a', color: 'red', ignored: 1 })
    let b = await tag.create(db, { id: 42, name: 'b' })

    expect(a).to.include({ name: 'a', color: 'red' })
    expect(b).to.include({ id: 42, name: 'b', color: null })

    await tag.save(db, { id: a.id, name: 'c', color: null })
    expect((await tag.load(db, [a.id]))[a.id])
      .to.include({ name: 'c', color: null })

    await assert.rejects(tag.save(db, { id: a.id, created: 0 }))
  })
})
