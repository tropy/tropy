'use strict'

describe('util', () => {
  const util = __require('common/util')

  describe('.once', () => {
    const { once } = util

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
          setTimeout(() => ee.emit('error', new Error()), 25)
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

  describe('.flatten', () => {
    const { flatten } = util

    it('flattens empty objects', () =>
      expect(flatten({})).to.eql({}))

    it('flattens dictionaries', () =>
      expect(flatten({ foo: { bar: 'baz' } })).to.eql({ 'foo.bar': 'baz' }))
  })

  describe('.strftime', () => {
    const { strftime } = util

    it('supports subset of stdlib strftime', () => {
      const date = new Date(2016, 8, 3, 23, 11, 5)

      expect(strftime('%Y-%m-%d %H:%M:%S', date)).to.eql('2016-09-03 23:11:05')
      expect(strftime('%y-%m-%d %H:%M:%S', date)).to.eql('16-09-03 23:11:05')
      expect(strftime('y-m-d', date)).to.eql('y-m-d')
    })
  })
})
