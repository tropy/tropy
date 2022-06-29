import { DisposableResource, using } from '../../src/common/disposable.js'

describe('.using', () => {

  it('rejects unless called with a disposable resource', async () => {
    await expect(using()).eventually.to.be.rejected
    await expect(using({}, sinon.spy())).eventually.to.be.rejected
  })

  describe('given a disposable resource', () => {
    let res = {}
    let disposable

    beforeEach(() => {
      disposable = new DisposableResource(res, sinon.spy())
    })

    it('calls handler with resource', async () => {
      let handler = sinon.spy()

      await expect(using(disposable, handler))
        .eventually.to.be.fulfilled

      expect(handler).to.have.been.calledOnce
      expect(handler).to.have.been.calledWith(res)
    })

    it('disposes of resource on success', async () => {
      await expect(using(disposable, sinon.spy()))
        .eventually.to.be.fulfilled

      expect(disposable.dispose).to.have.been.calledOnce
      expect(disposable.dispose).to.have.been.calledWith(res)
    })

    it('disposes of resource if handler throws', async () => {
      await expect(using(disposable, sinon.stub().throws()))
        .eventually.to.be.rejected

      expect(disposable.dispose).to.have.been.calledOnce
      expect(disposable.dispose).to.have.been.calledWith(res)
    })

    it('disposes of resource if handler rejects', async () => {
      await expect(using(disposable, sinon.stub().rejects()))
        .eventually.to.be.rejected

      expect(disposable.dispose).to.have.been.calledOnce
      expect(disposable.dispose).to.have.been.calledWith(res)
    })

    it('does not dispose of resource if resource promise rejects', async () => {
      disposable.promise = Promise.reject(new Error())

      await expect(using(disposable, sinon.spy()))
        .eventually.to.be.rejected

      expect(disposable.dispose).to.have.callCount(0)
    })
  })
})
