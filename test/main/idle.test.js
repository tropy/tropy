import { mock } from 'node:test'
import * as idleService from '#tropy/main/idle.js'

describe('idle', () => {
  const ioq = idleService.IOQ.global

  let o1, o2

  beforeEach(() => {
    o1 = mock.fn()
    o2 = mock.fn()
  })

  afterEach(() => {
    ioq.clear().pause()
  })

  describe('addIdleObserver', () => {
    it('must be called with observer and time', () => {
      expect(() => idleService.addIdleObserver()).to.throw()
      expect(() => idleService.addIdleObserver(o1)).to.throw()
      expect(() => idleService.addIdleObserver({}, 10)).to.throw()
      expect(ioq.isEmpty).to.be.true
    })

    it('must be called with time above precision', () => {
      expect(() => idleService.addIdleObserver(o1, ioq.precision)).to.throw()
      expect(ioq.isEmpty).to.be.true
    })

    it('registers valid observers', () => {
      let before = ioq.observers.length
      idleService.addIdleObserver(o1, 50)
      idleService.addIdleObserver(o2, 50)
      idleService.addIdleObserver(o1, 50)
      expect(ioq.observers.length).to.equal(before + 3)
    })
  })

  describe('removeIdleObserver', () => {
    beforeEach(() => {
      idleService.addIdleObserver(o1, 50)
      idleService.addIdleObserver(o2, 40)
      idleService.addIdleObserver(o1, 40)
    })

    it('ignores unknown observers/time', () => {
      let before = ioq.observers.length
      idleService.removeIdleObserver({}, 10)
      expect(ioq.observers.length).to.equal(before)
      idleService.removeIdleObserver(o1, 10)
      expect(ioq.observers.length).to.equal(before)
    })

    it('removes registered observers/time', () => {
      expect(ioq.observers.length).to.equal(3)
      idleService.removeIdleObserver(o1, 50)
      expect(ioq.observers.length).to.equal(2)
      idleService.removeIdleObserver(o1, 40)
      expect(ioq.observers.length).to.equal(1)
      idleService.removeIdleObserver(o2, 40)
      expect(ioq.observers.length).to.equal(0)
    })
  })

  describe('callbacks', () => {
    let getIdleTime, idle

    const tick = (rt = 1, it = 0) => {
      idle = it
      mock.timers.tick(ioq.precision * 1000 * rt)
    }

    beforeEach(() => {
      getIdleTime = mock.method(ioq, 'getIdleTime', () => idle)
      mock.timers.enable({ apis: ['setInterval'] })
      idle = 0
      idleService.addIdleObserver(o1, 50)
      idleService.addIdleObserver(o1, 30)
      idleService.addIdleObserver(o2, 35)
    })

    afterEach(() => {
      getIdleTime.mock.restore()
      mock.timers.reset()
    })

    it('notifies observers when idle threshold is reached', () => {
      tick(20, 10)
      expect(o1.mock.callCount()).to.equal(0)
      expect(o2.mock.callCount()).to.equal(0)
      tick(5, 30)
      expect(o1.mock.callCount()).to.equal(1)
      expect(o1.mock.calls[0].arguments[1]).to.equal('idle')
      expect(o2.mock.callCount()).to.equal(0)
      tick(5, 40)
      expect(o1.mock.callCount()).to.equal(1)
      expect(o2.mock.callCount()).to.equal(1)
      expect(o2.mock.calls[0].arguments[1]).to.equal('idle')
      tick(5, 50)
      expect(o1.mock.callCount()).to.equal(2)
      expect(o1.mock.calls[1].arguments[1]).to.equal('idle')
      expect(o2.mock.callCount()).to.equal(1)
    })

    it('notifies observers on idle/active transitions', () => {
      tick(5, 100)
      expect(o1.mock.callCount()).to.equal(2)
      expect(o2.mock.callCount()).to.equal(1)
      tick(5, 0)
      expect(o1.mock.callCount()).to.equal(4)
      expect(o2.mock.callCount()).to.equal(2)
      expect(o1.mock.calls[2].arguments[1]).to.equal('active')
      expect(o1.mock.calls[3].arguments[1]).to.equal('active')
      expect(o2.mock.calls[1].arguments[1]).to.equal('active')
      tick(5, 40)
      expect(o1.mock.callCount()).to.equal(5)
      expect(o2.mock.callCount()).to.equal(3)
      tick(5, 0)
      expect(o1.mock.callCount()).to.equal(6)
      expect(o2.mock.callCount()).to.equal(4)
      expect(o1.mock.calls[4].arguments[1]).to.equal('idle')
      expect(o1.mock.calls[5].arguments[1]).to.equal('active')
    })
  })
})
