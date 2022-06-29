import { EventEmitter } from 'node:events'
import * as util from '../../src/common/util.js'

describe('util', () => {

  describe('.once', () => {
    describe('given an event emitter', () => {
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
          expect(util.once(ee, 'evt')).eventually.to.eql([42])
        ))

        it('cleans up', () => (
          util.once(ee, 'evt').then(() => {
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
          expect(util.once(ee, 'evt')).eventually.to.be.rejected
        ))

        it('cleans up', () => (
          util.once(ee, 'evt').catch(() => {
            expect(ee.removeListener)
              .to.have.been.calledWith('evt')
              .and.to.have.been.calledWith('error')
          })
        ))
      })
    })
  })

  describe('.flatten', () => {
    it('flattens empty objects', () =>
      expect(util.flatten({})).to.eql({}))

    it('util.flattens dictionaries', () =>
      expect(
        util.flatten({ foo: { bar: 'baz' } })
      ).to.eql({ 'foo.bar': 'baz' }))
  })

  describe('.strftime', () => {
    it('supports subset of stdlib strftime', () => {
      const date = new Date(2016, 8, 3, 23, 11, 5)

      expect(
        util.strftime('%Y-%m-%d %H:%M:%S', date)
      ).to.eql('2016-09-03 23:11:05')
      expect(
        util.strftime('%y-%m-%d %H:%M:%S', date)
      ).to.eql('16-09-03 23:11:05')
      expect(util.strftime('y-m-d', date)).to.eql('y-m-d')
    })
  })

  describe('.pick', () => {
    it('picks the given properties', () =>
      expect(util.pick({ foo: 1, bar: 2 }, ['bar'])).to.eql({ bar: 2 }))

    it('is empty when there is no match', () =>
      expect(util.pick({ foo: 1, bar: 2 }, ['baz'])).to.be.empty)

    it('returns a new object', () => {
      const obj = { foo: 1 }
      expect(util.pick(obj, ['foo'])).to.eql(obj).and.not.equal(obj)
    })
  })

  describe('.omit', () => {
    it('picks the given properties', () =>
      expect(util.omit({ foo: 1, bar: 2 }, ['bar'])).to.eql({ foo: 1 }))

    it('is empty when there is a complete match', () =>
      expect(util.omit({ foo: 1, bar: 2 }, ['bar', 'foo'])).to.be.empty)

    it('returns a new object', () => {
      const obj = { foo: 1 }
      expect(util.omit(obj, ['bar'])).to.eql(obj).and.not.equal(obj)
    })
  })

  describe('.move', () => {
    describe('with offset 0', () => {
      it('moves a in front of b', () => {
        expect(util.move([1, 2, 3], 3, 2, 0)).to.eql([1, 3, 2])
        expect(util.move([1, 2, 3], 3, 1, 0)).to.eql([3, 1, 2])

        expect(util.move([1, 2, 3], 2, 1, 0)).to.eql([2, 1, 3])
        expect(util.move([1, 2, 3], 2, 3, 0)).to.eql([1, 2, 3])

        expect(util.move([1, 2, 3], 1, 3, 0)).to.eql([2, 1, 3])
        expect(util.move([1, 2, 3], 1, 2, 0)).to.eql([1, 2, 3])

        expect(util.move([1, 2, 3], 1, 1, 0)).to.eql([1, 2, 3])
        expect(util.move([1, 2, 3], 2, 2, 0)).to.eql([1, 2, 3])
        expect(util.move([1, 2, 3], 3, 3, 0)).to.eql([1, 2, 3])
      })
    })

    describe('with offset 1', () => {
      it('moves a behind b', () => {
        expect(util.move([1, 2, 3], 3, 2, 1)).to.eql([1, 2, 3])
        expect(util.move([1, 2, 3], 3, 1, 1)).to.eql([1, 3, 2])

        expect(util.move([1, 2, 3], 2, 1, 1)).to.eql([1, 2, 3])
        expect(util.move([1, 2, 3], 2, 3, 1)).to.eql([1, 3, 2])

        expect(util.move([1, 2, 3], 1, 3, 1)).to.eql([2, 3, 1])
        expect(util.move([1, 2, 3], 1, 2, 1)).to.eql([2, 1, 3])

        expect(util.move([1, 2, 3], 1, 1, 1)).to.eql([1, 2, 3])
        expect(util.move([1, 2, 3], 2, 2, 1)).to.eql([1, 2, 3])
        expect(util.move([1, 2, 3], 3, 3, 1)).to.eql([1, 2, 3])
      })
    })
  })

  describe('.swap', () => {
    it('swaps the items at the given positions', () => {
      expect(util.swap([1, 2, 3], 0, 0)).to.eql([1, 2, 3])
      expect(util.swap([1, 2, 3], 1, 1)).to.eql([1, 2, 3])
      expect(util.swap([1, 2, 3], 2, 2)).to.eql([1, 2, 3])

      expect(util.swap([1, 2, 3], 0, 1)).to.eql([2, 1, 3])
      expect(util.swap([1, 2, 3], 0, 2)).to.eql([3, 2, 1])
      expect(util.swap([1, 2, 3], 2, 0)).to.eql([3, 2, 1])

      expect(util.swap([1, 2, 3], 0, 4)).to.eql([3, 2, 1])
      expect(util.swap([1, 2, 3], 0, -1)).to.eql([1, 2, 3])
    })
  })

  describe('.adjacent', () => {
    it('returns the two items adjacent to the given item', () => {
      expect(util.adjacent([])).to.eql([])
      expect(util.adjacent([], 1)).to.eql([])

      expect(util.adjacent([1], 1)).to.eql([])
      expect(util.adjacent([1, 2], 1)).to.eql([undefined, 2])
      expect(util.adjacent([1, 2], 2)).to.eql([1])
      expect(util.adjacent([1, 2, 3], 1)).to.eql([undefined, 2])
      expect(util.adjacent([1, 2, 3], 2)).to.eql([1, 3])
      expect(util.adjacent([1, 2, 3], 3)).to.eql([2])
    })
  })

  describe('.get', () => {
    it('returns the value', () => {
      expect(util.get({}, '')).to.eql({})
      expect(util.get(null, '')).to.be.undefined
      expect(util.get(undefined, '')).to.be.undefined

      expect(util.get({}, 'a')).to.be.undefined
      expect(util.get({ a: 1 }, 'a')).to.eql(1)
      expect(util.get({ a: { b: 1 } }, 'a')).to.eql({ b: 1 })
      expect(util.get({ a: { b: 1 } }, 'a.b')).to.eql(1)
      expect(util.get({ a: { b: 1 } }, 'a.c')).to.undefined
      expect(util.get({ a: { b: null } }, 'a.b')).to.be.null
    })
  })

  describe('.set', () => {
    it('on objects', () => {
      expect(util.set({}, 'foo', 1)).to.eql({ foo: 1 })
    })
    it('on deep objects', () => {
      expect(util.set({ foo: { bar: 42 } }, 'foo.bar', 1))
        .to.eql({ foo: { bar: 1 } })
    })
    it('on deep objects, keep existing properties', () => {
      expect(util.set({ baz: 2 }, 'foo.bar', 1))
        .to.eql({ baz: 2, foo: { bar: 1 } })
    })
    it('on deep objects, 3 levels deep', () => {
      expect(util.set({}, 'foo.bar.baz', 1))
        .to.eql({ foo: { bar: { baz: 1 } } })
    })
    it('does not change the source object', () => {
      let obj = Object.freeze({})
      expect(util.set(obj, 'foo.bar.baz', 1))
        .to.eql({ foo: { bar: { baz: 1 } } })
    })
  })

  describe('.has', () => {
    it('tests for existence', () => {
      expect(util.has({}, '')).to.be.true
      expect(util.has(null, '')).to.be.false
      expect(util.has(undefined, '')).to.be.false

      expect(util.has({}, 'a')).to.be.false
      expect(util.has({ a: 1 }, 'a')).to.be.true
      expect(util.has({ a: { b: 1 } }, 'a')).to.be.true
      expect(util.has({ a: { b: 1 } }, 'a.b')).to.be.true
      expect(util.has({ a: { b: false } }, 'a.b')).to.be.true
      expect(util.has({ a: { b: null } }, 'a.b')).to.be.true
      expect(util.has({ a: { b: undefined } }, 'a.b')).to.be.true
      expect(util.has({ a: { b: 1 } }, 'a.c')).to.be.false
    })
  })

  describe('.merge', () => {
    it('returns a new object', () => {
      const a = {}
      const b = {}

      expect(util.merge(a, b)).to.eql({})
      expect(util.merge(a, b)).to.not.equal(a)
      expect(util.merge(a, b)).to.not.equal(b)
    })

    it('deeply merges two objects', () => {
      expect(util.merge({ a: 1 }, { b: 2 })).to.eql({ a: 1, b: 2 })
      expect(util.merge({ a: 1 }, { b: 2, a: 3 })).to.eql({ a: 3, b: 2 })
      expect(util.merge({ a: 1 }, { a: null })).to.eql({ a: null })
      expect(util.merge({ a: 1 }, { a: undefined })).to.eql({ a: undefined })

      let date = new Date()
      expect(util.merge({}, { date })).to.have.property('date').and.eql(date)
      expect(util.merge({}, { date }).date).to.not.equal(date)

      let a = { x: 1, y: 2 }
      let b = { x: 3, z: 4 }

      expect(util.merge({ a }, { a: b }))
        .to.have.property('a')
        .and.eql({ x: 3, y: 2, z: 4 })

      expect(util.merge({ a: [1] }, { b: 2, a: [3] })).to.eql({ a: [3], b: 2 })
    })
  })

  describe('.uniq', () => {
    it('returns array of unique values', () => {
      expect(util.uniq([])).to.eql([])
      expect(util.uniq([1])).to.eql([1])
      expect(util.uniq([1, 2, 3, 1, 3, 4])).to.eql([1, 2, 3, 4])
    })
  })

  describe('.mixed', () => {
    it('returns true for mixed contents', () => {
      expect(util.mixed([])).to.be.false
      expect(util.mixed([1])).to.be.false
      expect(util.mixed([1, 1])).to.be.false
      expect(util.mixed([1, 1, 1])).to.be.false
      expect(util.mixed([2, 1, 1])).to.be.true
      expect(util.mixed([2, 2, 1])).to.be.true
      expect(util.mixed([1, 2])).to.be.true
    })
  })

  describe('.remove', () => {
    it('returns new array', () => {
      const a = [1, 2, 3]
      expect(util.remove(a)).not.to.equal(a)
      expect(util.remove(a, 1)).not.to.equal(a)
    })

    it('removes given items', () => {
      expect(util.remove([])).to.eql([])
      expect(util.remove([], 1)).to.eql([])
      expect(util.remove([1], 1)).to.eql([])
      expect(util.remove([1, 2], 1)).to.eql([2])
      expect(util.remove([1, 2], 1, 3)).to.eql([2])
      expect(util.remove([1, 2, 3], 1, 3)).to.eql([2])
    })
  })

  describe('.shallow', () => {
    it('returns true if params are shallowly equal', () => {
      const a = { a: 1, b: [], c: 'foo' }
      const b = { a: 1, b: a.b, c: 'foo' }

      expect(util.shallow(a, a)).to.be.true
      expect(util.shallow(a, b)).to.be.true
    })

    it('returns false if params are not equal', () => {
      const a = { a: 1, b: [], c: 'foo' }
      const b = { a: 1, b: [], c: 'foo' }

      expect(util.shallow(a, b)).to.be.false
    })

    it('returns false if one param is an array', () => {
      expect(util.shallow([], {})).to.be.false
      expect(util.shallow({}, [])).to.be.false
    })

    it('returns false for two arrays with different content', () => {
      expect(util.shallow([1], [])).to.be.false
      expect(util.shallow([], [1])).to.be.false
      expect(util.shallow([1], [2])).to.be.false
      expect(util.shallow([1], [1, 2])).to.be.false
      expect(util.shallow([1, 2], [2, 1])).to.be.false
    })

    it('returns true for two arrays with identical content', () => {
      expect(util.shallow([], [])).to.be.true
      expect(util.shallow([1], [1])).to.be.true
      expect(util.shallow([1, 2], [1, 2])).to.be.true
    })

    it('compares atomic params for identity', () => {
      expect(util.shallow(null, {})).to.be.false
      expect(util.shallow({}, null)).to.be.false
      expect(util.shallow(null)).to.be.false
      expect(util.shallow(undefined, null)).to.be.false
      expect(util.shallow()).to.be.true
      expect(util.shallow(null, null)).to.be.true
      expect(util.shallow(3, 3)).to.be.true
      expect(util.shallow('1', 1)).to.be.false
      expect(util.shallow(1, 2)).to.be.false
    })
  })

  describe('.camelcase', () => {
    expect(util.camelcase('')).to.eql('')
    expect(util.camelcase('foo')).to.eql('foo')
    expect(util.camelcase('Foo')).to.eql('foo')
    expect(util.camelcase('foo bar')).to.eql('fooBar')
    expect(util.camelcase('Foo Bar')).to.eql('fooBar')
    expect(util.camelcase('one two three')).to.eql('oneTwoThree')
  })

  describe('.morph', () => {
    const upcase = (acc, prop, value) => {
      acc[prop.toUpperCase()] = value.toUpperCase()
    }

    it('returns new object', () => {
      let a = { foo: 'bar' }
      expect(util.morph(a, upcase)).not.to.equal(a)
    })

    it('morphs all entries', () => {
      expect(util.morph({}, upcase)).to.eql({})
      expect(util.morph({ foo: 'bar' }, upcase)).to.eql({ FOO: 'BAR' })
      expect(util.morph({ foo: 'bar' }, upcase)).to.eql({ FOO: 'BAR' })
    })
  })

  describe('.pMap', () => {
    it('accepts an empty list', async () => {
      let spy = sinon.spy()

      expect(await util.pMap([], spy))
        .to.be.an('array').that.is.empty

      expect(spy).not.to.have.been.called
    })

    it('passes items and index to the mapper', async () => {
      let spy = sinon.spy()

      expect(await util.pMap(['a', 'b'], spy))
        .to.be.an('array').of.length(2)

      expect(spy).to.have.been.calledTwice
      expect(spy).to.have.been.calledWith('a', 0)
      expect(spy).to.have.been.calledWith('b', 1)
    })

    it('throws aggregate error on mapper rejection', async () => {
      let stub = sinon.stub()

      stub.resolvesArg(0)
      stub.onCall(1).rejects()

      await expect(
        util.pMap([1, 2, 3], stub, { concurrency: 1 })
      ).to.eventually.be.rejectedWith(AggregateError)

      expect(stub).to.have.callCount(3)
    })

    it('throws aggregate error on mapper throw', async () => {
      let stub = sinon.stub()

      stub.onCall(0).throws()
      stub.resolvesArg(0)

      await expect(
        util.pMap([1, 2, 3], stub, { concurrency: 1 })
      ).to.eventually.be.rejectedWith(AggregateError)

      expect(stub).to.have.callCount(3)
    })

    it('resolves mapped promises', () => (
      expect(util.pMap([1, 2, 3, 4], sinon.stub().resolvesArg(1)))
        .to.eventually.eql([0, 1, 2, 3])
    ))

    it('resolves input promises', () => (
      expect(util.pMap([Promise.resolve(2)], (x) => x + x))
        .to.eventually.eql([4])
    ))

    it('supports concurrency', () =>
      expect(
        Promise.race([
          util.pMap([1, 2, 3], () => util.delay(25, 'a'), { concurrency: 1 }),
          util.pMap([1, 2, 3], () => util.delay(25, 'b'), { concurrency: 3 })
        ])
      ).to.eventually.eql(['b', 'b', 'b']))
  })
})
