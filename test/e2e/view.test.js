import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { tropy } from './support.js'

describe('see what the user sees', () => {
  let project // Re-uses Alpha.tpy from create-project test
  let item

  it('opens the project', async () => {
    let res = await tropy.api('/projects', {
      method: 'POST',
      body: { path: tropy.path('Alpha.tpy') }
    })

    assert.equal(res.status, 200)
    assert.equal(res.body.open, true)

    project = res.body
  })

  it('shows the search and the selection', async () => {
    let { status, body } = await tropy.api(`/projects/${project.urlId}/view`)

    assert.equal(status, 200)
    assert.equal(body.mode, 'project')

    assert.equal(body.search.view, 'project')
    assert.equal(body.search.list, null)
    assert.equal(body.search.sort, 'http://purl.org/dc/elements/1.1/title')
    assert.equal(body.search.reverse, false)

    assert.deepEqual(Object.keys(body.selected),
      ['items', 'photos', 'selections', 'notes'])
    assert.deepEqual(Object.keys(body.cursor),
      ['item', 'photo', 'selection', 'note'])
  })

  it('shows the search the user ran', async () => {
    await tropy.mcp('open', {
      url: `tropy://project/${project.urlId}/items?q=apricot`
    })

    let { body } = await tropy.api(`/projects/${project.urlId}/view`)

    assert.equal(body.search.q, 'apricot')
  })

  it('shows the item the user opened', async () => {
    ;[item] = (await tropy.api(`/projects/${project.urlId}/items`)).body

    await tropy.mcp('open', {
      url: `tropy://project/${project.urlId}/items/${item.id}`
    })

    let { body } = await tropy.api(`/projects/${project.urlId}/view`)

    assert.equal(body.mode, 'item')
    assert.deepEqual(body.selected.items, [item.id])
    assert.deepEqual(body.selected.photos, item.photos)
    assert.deepEqual(body.cursor, {
      item: item.id, photo: item.photos[0], selection: null, note: null
    })
  })

  it('closes the project', async () => {
    let res = await tropy.api(`/projects/${project.urlId}/close`, {
      method: 'POST'
    })

    assert.equal(res.status, 200)
  })
})
