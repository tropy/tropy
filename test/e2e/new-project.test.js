import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { describe, it } from 'node:test'
import { fixture, useTropy } from './support.js'

describe('a new project', () => {
  let tropy = useTropy()
  let project

  it('creates a project', async () => {
    let res = await tropy.api('/projects', {
      method: 'POST',
      body: { path: tropy.path('Alpha.tpy'), create: true, name: 'Alpha' }
    })

    assert.equal(res.status, 201)
    assert.equal(res.body.open, true)

    project = res.body
  })

  it('imports a photo', async () => {
    let res = await tropy.api(`/projects/${project.urlId}/import`, {
      method: 'POST',
      body: { files: [fixture('images', 'PA140105.JPG')] }
    })

    assert.equal(res.status, 201)
    assert.equal(res.body.length, 1)
  })

  it('finds the photo by its file name', async () => {
    let found = await tropy.api(`/projects/${project.urlId}/items?q=PA140105`)
    let none = await tropy.api(`/projects/${project.urlId}/items?q=nomatch`)

    assert.equal(found.status, 200)
    assert.equal(found.body.length, 1)
    assert.deepEqual(none.body, [])
  })

  it('quits without errors', async () => {
    await tropy.quit()

    assert.equal(tropy.exitCode, 0)
    assert.deepEqual(await tropy.errors(), [])
    assert.deepEqual(await tropy.crashes(), [])
  })

  it('leaves the project in its file', async () => {
    let db = new DatabaseSync(project.path)

    try {
      assert.equal(db.prepare('SELECT count(*) AS n FROM items').get().n, 1)
      assert.equal(db.prepare('SELECT count(*) AS n FROM photos').get().n, 1)

      for (let fts of ['fts_notes', 'fts_metadata', 'fts_transcriptions'])
        db.exec(`INSERT INTO ${fts}(${fts}, rank) VALUES ('integrity-check', 1)`)
    } finally {
      db.close()
    }

    assert.deepEqual((await tropy.state()).recent, [project.path])
  })
})
