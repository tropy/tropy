import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { channel, product, version } from '#tropy/common/release.js'
import { tropy } from './support.js'

describe('status', () => {
  it('reports tropy api status', async () => {
    let { status, body } = await tropy.api('/')

    assert.equal(status, 200)
    assert.equal(body.status, 'ok')
    assert.deepEqual(
      [body.name, body.version, body.channel],
      [product, version, channel])
  })
})
