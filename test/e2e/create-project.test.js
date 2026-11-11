import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { describe, it } from 'node:test'
import { checkProject, fixture, tropy } from './support.js'

describe('create a project', () => {
  let project

  it('creates a project', async () => {
    let res = await tropy.api('/projects', {
      method: 'POST',
      body: {
        path: tropy.path('Alpha.tpy'),
        create: true,
        name: 'Alpha'
      }
    })

    assert.equal(res.status, 201)
    assert.equal(res.body.open, true)

    project = res.body
  })

  it('imports a photo', async () => {
    let res = await tropy.api(`/projects/${project.urlId}/import`, {
      method: 'POST',
      body: { files: [fixture('images', 'apricot.jpg')] }
    })

    assert.equal(res.status, 201)
    assert.equal(res.body.length, 1)
  })

  it('finds the photo by its file name', async () => {
    let found = await tropy.api(`/projects/${project.urlId}/items?q=apricot`)
    let none = await tropy.api(`/projects/${project.urlId}/items?q=nomatch`)

    assert.equal(found.status, 200)
    assert.equal(found.body.length, 1)
    assert.deepEqual(none.body, [])
  })

  it('closes the project', async () => {
    let res = await tropy.api(`/projects/${project.urlId}/close`, {
      method: 'POST'
    })

    assert.equal(res.status, 200)
    assert.equal(res.body.open, false)
  })

  it('leaves the photo in a sound project file', () => {
    let db = new DatabaseSync(project.path, { readOnly: true })

    try {
      assert.equal(db.prepare('SELECT count(*) AS n FROM items').get().n, 1)
      assert.equal(db.prepare('SELECT count(*) AS n FROM photos').get().n, 1)
    } finally {
      db.close()
    }

    assert.deepEqual(checkProject(project.path), [])
  })
})
