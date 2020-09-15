import * as idleService from '../../src/browser/idle'

describe('idle', () => {
  const ioq = idleService.IOQ.global

  describe('Adding and removing observers', () => {
    let o1, o2
    let numObservers = () => ioq.observers.length

    beforeEach(() => {
      o1 = sinon.spy()
      o2 = sinon.spy()
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

      const tick = async (rt = 1, it = 0) => {
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

      it('idle', async () => {
        await tick(20, 10)
        expect(o1).not.to.have.been.called
        expect(o2).not.to.have.been.called
        await tick(5, 30)
        expect(o1).to.have.been.calledOnce
        expect(o1.args[0][1]).to.eql('idle')
        expect(o2).not.to.have.been.called
        await tick(5, 40)
        expect(o1).to.have.been.calledOnce
        expect(o2).to.have.been.calledOnce
        expect(o2.args[0][1]).to.eql('idle')
        await tick(5, 50)
        expect(o1).to.have.been.calledTwice
        expect(o1.args[1][1]).to.eql('idle')
        expect(o2).to.have.been.calledOnce
      })

      it('active', async () => {
        await tick(5, 100)
        expect(o1.callCount).to.eql(2)
        expect(o2.callCount).to.eql(1)
        await tick(5, 0)
        expect(o1.callCount).to.eql(4)
        expect(o2.callCount).to.eql(2)
        expect(o1.args[2][1]).to.eql('active')
        expect(o1.args[3][1]).to.eql('active')
        expect(o2.args[1][1]).to.eql('active')
        await tick(5, 40)
        expect(o1.callCount).to.eql(5)
        expect(o2.callCount).to.eql(3)
        await tick(5, 0)
        expect(o1.callCount).to.eql(6)
        expect(o2.callCount).to.eql(4)
        expect(o1.args[4][1]).to.eql('idle')
        expect(o1.args[5][1]).to.eql('active')
      })
    })
  })
})
