import { contains, round, Seeded } from '#tropy/common/math.js'

describe('math', () => {
  describe('contains', () => {
    const rect = { left: 10, top: 10, right: 90, bottom: 90 }

    it('accepts points', () => {
      expect(contains(rect, { x: 50, y: 50 })).to.be.true
      expect(contains(rect, { x: 10, y: 90 })).to.be.true
      expect(contains(rect, { x: 5, y: 50 })).to.be.false
      expect(contains(rect, { x: 50, y: 95 })).to.be.false
    })

    it('accepts rectangles in left/top/right/bottom form', () => {
      expect(contains(rect, { left: 20, top: 20, right: 30, bottom: 30 }))
        .to.be.true
      expect(contains(rect, rect)).to.be.true
      expect(contains(rect, { left: 20, top: 85, right: 30, bottom: 95 }))
        .to.be.false
      expect(contains(rect, { left: 5, top: 20, right: 30, bottom: 30 }))
        .to.be.false
    })

    it('accepts rectangles in x/y/width/height form', () => {
      expect(contains(rect, { x: 20, y: 20, width: 10, height: 10 }))
        .to.be.true
      expect(contains(rect, { x: 20, y: 85, width: 10, height: 10 }))
        .to.be.false
    })
  })

  describe('round', () => {
    it('rounds to integer', () => {
      expect(round(Math.PI)).to.equal(3)
    })

    it('accepts precision parameter', () => {
      expect(round(Math.PI, 100)).to.equal(3.14)
      expect(round(Math.PI, 1000)).to.equal(3.142)
    })
  })

  describe('Seeded', () => {
    const seed = Uint8Array.fromHex('6f1c2a9e3b4d4e8f9a1b2c3d4e5f6a7b')
    const sample = (rng, n = 10) => Array.from({ length: n }, () => rng.random())

    it('repeats the sequence for the same seed', () => {
      expect(sample(new Seeded(seed))).to.eql(sample(new Seeded(seed)))
      expect(sample(new Seeded(seed)))
        .not.to.eql(sample(new Seeded(new Uint8Array(16))))
    })

    it('pads short seeds with zeros at the front', () => {
      let padded = new Uint8Array(32)
      padded.set(seed, 16)
      expect(sample(new Seeded(seed))).to.eql(sample(new Seeded(padded)))
    })

    it('returns integers in the closed range', () => {
      let rng = new Seeded(seed)
      let values = new Set(Array.from({ length: 200 }, () => rng.int(2, 5)))
      expect([...values].sort()).to.eql([2, 3, 4, 5])
    })

    it('rejects bad seeds', () => {
      expect(() => new Seeded('seed')).to.throw(TypeError)
      expect(() => new Seeded(new Uint8Array(33))).to.throw(RangeError)
    })
  })
})
