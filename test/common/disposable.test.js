import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { DisposableResource, using } from '#tropy/common/disposable.js'

describe('using()', () => {
  it('rejects unless called with a disposable resource', async () => {
    await assert.rejects(() => using())
    await assert.rejects(() => using({}, mock.fn()))
  })

  describe('given a disposable resource', () => {
    let res = {}
    let dispose
    let disposable

    beforeEach(() => {
      dispose = mock.fn()
      disposable = new DisposableResource(res, dispose)
    })

    it('calls handler with resource', async () => {
      let handler = mock.fn()

      await using(disposable, handler)

      expect(handler.mock.callCount()).to.equal(1)
      expect(handler.mock.calls[0].arguments[0]).to.equal(res)
    })

    it('disposes of resource on success', async () => {
      await using(disposable, mock.fn())

      expect(dispose.mock.callCount()).to.equal(1)
      expect(dispose.mock.calls[0].arguments[0]).to.equal(res)
    })

    it('disposes of resource if handler throws', async () => {
      await assert.rejects(() =>
        using(disposable, () => { throw new Error('fail') }))

      expect(dispose.mock.callCount()).to.equal(1)
      expect(dispose.mock.calls[0].arguments[0]).to.equal(res)
    })

    it('disposes of resource if handler rejects', async () => {
      await assert.rejects(() =>
        using(disposable, () => Promise.reject(new Error('fail'))))

      expect(dispose.mock.callCount()).to.equal(1)
      expect(dispose.mock.calls[0].arguments[0]).to.equal(res)
    })

    it('does not dispose of resource if resource promise rejects', async () => {
      disposable.promise = Promise.reject(new Error())

      await assert.rejects(() =>
        using(disposable, mock.fn()))

      expect(dispose.mock.callCount()).to.equal(0)
    })
  })
})
