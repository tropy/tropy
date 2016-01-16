'use strict'

describe('util', () => {
  const util = __require('common/util')

  describe('.once', () => {
    const once = util.once

    describe('given an event emitter', () => {
      const { EventEmitter } = require('events')
      const ee = new EventEmitter()

      describe('when the event fires', () => {
        beforeEach(() => {
          sinon.spy(ee, 'removeListener')
          setTimeout(() => ee.emit('evt', 42), 25)
        })

        afterEach(() => {
          ee.removeListener.restore()
        })

        it('resolves', () => (
          expect(once(ee, 'evt')).eventually.to.eql(42)
        ))

        it('cleans up', () => (
          once(ee, 'evt').then(() => {
            expect(ee.removeListener)
              .to.have.been.calledWith('evt')
              .and.to.have.been.calledWith('error')
          })
        ))
      })

      describe('when the error event fires', () => {
        beforeEach(() => {
          sinon.spy(ee, 'removeListener')
          setTimeout(() => ee.emit('error'), 25)
        })

        afterEach(() => {
          ee.removeListener.restore()
        })

        it('is rejected', () => (
          expect(once(ee, 'evt')).eventually.to.be.rejected
        ))

        it('cleans up', () => (
          once(ee, 'evt').catch(() => {
            expect(ee.removeListener)
              .to.have.been.calledWith('evt')
              .and.to.have.been.calledWith('error')
          })
        ))
      })
    })
  })

})
