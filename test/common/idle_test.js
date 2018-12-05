'use strict'

describe('idle', () => {
  const idleService = __require('common/idle')
  const ioq = idleService.IOQ.global

  describe('Adding and removing observers', () => {
    let o1, o2
    let numObservers = () => ioq.observers.length

    beforeEach(() => {
      o1 = { observe: sinon.spy() }
      o2 = { observe: sinon.spy() }
    })

    afterEach(() => {
      ioq.clear().pause()
    })

    describe('.addIdleObserver', () => {
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
        expect(() => {
          idleService.addIdleObserver(o1, 50)
          idleService.addIdleObserver(o2, 50)
          idleService.addIdleObserver(o1, 50)
        }).to.increase(numObservers).by(3)
      })
    })

    describe('.removeIdleObserver', () => {
      beforeEach(() => {
        idleService.addIdleObserver(o1, 50)
        idleService.addIdleObserver(o2, 40)
        idleService.addIdleObserver(o1, 40)
      })

      it('ignores unknown observers/time', () => {
        expect(() => idleService.removeIdleObserver({}, 10))
          .not.to.decrease(numObservers)
        expect(() => idleService.removeIdleObserver(o1, 10))
          .not.to.decrease(numObservers)
      })

      it('removes registered observers/time', () => {
        expect(() => idleService.removeIdleObserver(o1, 50))
          .to.decrease(numObservers).by(1)
        expect(() => idleService.removeIdleObserver(o1, 40))
          .to.decrease(numObservers).by(1)
        expect(() => idleService.removeIdleObserver(o2, 40))
          .to.decrease(numObservers).by(1)
      })
    })

    describe('Callbacks', () => {
      let clock, idle

      function tick(rt = 1, it = 0) {
        idle = it
        clock.tick(ioq.precision * 1000 * rt)
      }

      beforeEach(() => {
        sinon.stub(ioq, 'getIdleTime').callsFake(() => idle)
        clock = sinon.useFakeTimers()
        idle = 0
        idleService.addIdleObserver(o1, 50)
        idleService.addIdleObserver(o1, 30)
        idleService.addIdleObserver(o2, 35)
      })

      afterEach(() => {
        ioq.getIdleTime.restore()
        clock.restore()
      })

      it('idle', () => {
        tick(20, 10)
        expect(o1.observe).not.to.have.been.called
        expect(o2.observe).not.to.have.been.called
        tick(5, 30)
        expect(o1.observe).to.have.been.calledOnce
        expect(o1.observe.args[0][1]).to.eql('idle')
        expect(o2.observe).not.to.have.been.called
        tick(5, 40)
        expect(o1.observe).to.have.been.calledOnce
        expect(o2.observe).to.have.been.calledOnce
        expect(o2.observe.args[0][1]).to.eql('idle')
        tick(5, 50)
        expect(o1.observe).to.have.been.calledTwice
        expect(o1.observe.args[1][1]).to.eql('idle')
        expect(o2.observe).to.have.been.calledOnce
      })

      it('active', () => {
        tick(5, 100)
        expect(o1.observe.callCount).to.eql(2)
        expect(o2.observe.callCount).to.eql(1)
        tick(5, 0)
        expect(o1.observe.callCount).to.eql(4)
        expect(o2.observe.callCount).to.eql(2)
        expect(o1.observe.args[2][1]).to.eql('active')
        expect(o1.observe.args[3][1]).to.eql('active')
        expect(o2.observe.args[1][1]).to.eql('active')
        tick(5, 40)
        expect(o1.observe.callCount).to.eql(5)
        expect(o2.observe.callCount).to.eql(3)
        tick(5, 0)
        expect(o1.observe.callCount).to.eql(6)
        expect(o2.observe.callCount).to.eql(4)
        expect(o1.observe.args[4][1]).to.eql('idle')
        expect(o1.observe.args[5][1]).to.eql('active')
      })
    })
  })
})

