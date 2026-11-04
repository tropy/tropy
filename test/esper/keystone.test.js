import {
  IDENTITY,
  adjust,
  apply,
  bounds,
  corners,
  crop,
  equals,
  fit,
  frame,
  homography,
  initial,
  invert,
  isConvex,
  keystone,
  measure,
  multiply,
  parse,
  stringify
} from '#tropy/esper/keystone.js'

const SOURCE = { width: 100, height: 100 }

// The 100x35 image turned clockwise: its bottom-left corner first.
const ROTATED = '[0,35,0,0,100,0,100,35]'

// A document seen from below: the top edge appears shorter.
const TRAPEZOID = '[10,0,90,0,100,100,0,100]'

const closeTo = (actual, expected, delta = 1e-6) => {
  expect(actual.x).to.be.closeTo(expected.x, delta)
  expect(actual.y).to.be.closeTo(expected.y, delta)
}

describe('esper/keystone', () => {
  describe('matrices', () => {
    it('multiplies', () => {
      let m = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      expect(multiply(IDENTITY, m)).to.eql(m)
      expect(multiply(m, IDENTITY)).to.eql(m)
      expect(multiply(m, m))
        .to.eql([30, 36, 42, 66, 81, 96, 102, 126, 150])
    })

    it('inverts', () => {
      let m = [2, 0, 1, 0, 3, 2, 0, 0, 1]
      let p = { x: 5, y: -3 }
      closeTo(apply(invert(m), apply(m, p)), p)
      expect(invert(IDENTITY)).to.eql([...IDENTITY])
    })

    it('computes bounding boxes', () => {
      expect(bounds(corners({ x: 1, y: 2, width: 3, height: 4 })))
        .to.eql({ x: 1, y: 2, width: 3, height: 4 })
    })
  })

  describe('parse', () => {
    it('returns null for no correction', () => {
      expect(parse(null)).to.be.null
      expect(parse(undefined)).to.be.null
      expect(parse('')).to.be.null
      expect(parse('nope')).to.be.null
      expect(parse('[1,2,3]')).to.be.null
      expect(parse('[1,2,3,4,5,6,7,"8"]')).to.be.null
    })

    it('returns the four corners', () => {
      expect(parse(ROTATED)).to.eql([
        { x: 0, y: 35 }, { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 35 }
      ])
      expect(parse('[1,2,3,4,5,6,7,8]')).to.eql([
        { x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }, { x: 7, y: 8 }
      ])
    })
  })

  describe('stringify', () => {
    it('rounds to hundredths of a pixel', () => {
      expect(stringify([
        { x: 1.4, y: 2.666 }, { x: 3, y: 4 }, { x: 5, y: 6 }, { x: 7, y: 8.005 }
      ])).to.equal('[1.4,2.67,3,4,5,6,7,8.01]')
    })

    it('keeps the sliders\' smallest steps', () => {
      let source = { width: 1240, height: 1754 }
      let points = adjust(initial(source), { vertical: 0.1 })

      expect(measure(parse(stringify(points))).vertical)
        .to.be.closeTo(0.1, 0.01)
    })

    it('keeps the corners of the source', () => {
      expect(stringify(null)).to.be.null
      expect(stringify(corners(SOURCE))).to.equal('[0,0,100,0,100,100,0,100]')
      expect(stringify(parse(ROTATED))).to.equal(ROTATED)
    })
  })

  describe('isConvex', () => {
    it('accepts quads given in order', () => {
      expect(isConvex(corners(SOURCE))).to.be.true
      expect(isConvex(parse(ROTATED))).to.be.true
      expect(isConvex(parse(TRAPEZOID))).to.be.true
    })

    it('rejects the rest', () => {
      expect(isConvex(null)).to.be.false
      expect(isConvex(corners(SOURCE).reverse())).to.be.false

      // Bow-tie
      expect(isConvex(parse('[0,0,100,100,100,0,0,100]'))).to.be.false

      // Collapsed edge
      expect(isConvex(parse('[0,0,0,0,100,100,0,100]'))).to.be.false

      // Dent
      expect(isConvex(parse('[0,0,100,0,40,40,0,100]'))).to.be.false
    })
  })

  describe('frame', () => {
    it('is the rectangle itself', () => {
      let rect = { x: 10, y: 20, width: 30, height: 40 }
      expect(frame(corners(rect))).to.eql(rect)
    })

    it('has the centre and the average edges of the quad', () => {
      expect(frame(parse(ROTATED)))
        .to.eql({ x: 32.5, y: -32.5, width: 35, height: 100 })

      let f = frame(parse(TRAPEZOID))
      expect(f.x).to.equal(5)
      expect(f.width).to.equal(90)
      expect(f.height).to.be.closeTo(100.499, 1e-3)
    })
  })

  describe('homography', () => {
    it('is the identity without corners', () => {
      expect(homography(null)).to.equal(IDENTITY)
    })

    it('maps the corners onto the frame', () => {
      for (let value of [ROTATED, TRAPEZOID]) {
        let points = parse(value)
        let rect = frame(points)
        let H = homography(points)

        points.map(p => apply(H, p)).forEach((p, i) => {
          closeTo(p, corners(rect)[i])
        })
      }
    })
  })

  describe('crop', () => {
    const photo = corners({ x: 0, y: 0, ...SOURCE })

    it('grows from the frame until it touches the photo', () => {
      let rect = { x: 25, y: 25, width: 50, height: 50 }
      expect(crop(rect, photo, SOURCE))
        .to.eql({ x: 0, y: 0, width: 100, height: 100 })

      rect = { x: 10, y: 40, width: 20, height: 20 }
      expect(crop(rect, photo, SOURCE))
        .to.eql({ x: 0, y: 30, width: 40, height: 40 })
    })

    it('has the aspect ratio of the source', () => {
      let rect = { x: 20, y: 30, width: 60, height: 40 }
      let box = crop(rect, photo, { width: 200, height: 100 })

      expect(box.width / box.height).to.equal(2)
      expect(box.x + box.width / 2).to.equal(50)
      expect(box.y + box.height / 2).to.equal(50)
    })

    it('is never smaller than the frame', () => {
      let rect = { x: 0, y: 0, width: 100, height: 20 }
      let box = crop(rect, photo, { width: 100, height: 100 })

      expect(box.width).to.equal(100)
      expect(box.height).to.equal(100)
      expect(box.y).to.equal(-40)
    })

    it('stays within the limit', () => {
      let rect = { x: 45, y: 45, width: 10, height: 10 }
      let far = corners({ x: -1000, y: -1000, width: 2100, height: 2100 })

      expect(crop(rect, far, SOURCE))
        .to.eql({ x: 25, y: 25, width: 50, height: 50 })
      expect(crop(rect, null, SOURCE))
        .to.eql({ x: 25, y: 25, width: 50, height: 50 })
    })
  })

  describe('initial', () => {
    it('is the source itself', () => {
      let points = initial({ width: 200, height: 100 })
      expect(points).to.eql(corners({ x: 0, y: 0, width: 200, height: 100 }))
      expect(measure(points)).to.eql({ rotate: 0, vertical: 0, horizontal: 0 })
    })
  })

  describe('measure', () => {
    it('is zero for a straight rectangle', () => {
      expect(measure(corners(SOURCE)))
        .to.eql({ rotate: 0, vertical: 0, horizontal: 0 })
    })

    it('measures rotation, clockwise', () => {
      // The quad's top edge points up the photo's left edge: the
      // document lies turned counter-clockwise.
      expect(measure(parse(ROTATED)).rotate).to.be.closeTo(-90, 1e-6)

      let tilted = adjust(corners(SOURCE), { rotate: 12.5 })
      expect(measure(tilted).rotate).to.be.closeTo(12.5, 1e-6)
    })

    it('measures perspective', () => {
      let m = measure(parse(TRAPEZOID))
      expect(m.vertical).to.be.closeTo(100 * (80 - 100) / 180, 1e-6)
      expect(m.horizontal).to.be.closeTo(0, 1e-6)
      expect(m.rotate).to.be.closeTo(0, 1e-6)

      m = measure(parse('[0,0,100,10,100,90,0,100]'))
      expect(m.horizontal).to.be.closeTo(100 * (80 - 100) / 180, 1e-6)
      expect(m.vertical).to.be.closeTo(0, 1e-6)
    })
  })

  describe('adjust', () => {
    it('rotates about the centre', () => {
      let points = adjust(corners(SOURCE), { rotate: 90 })

      closeTo(points[0], { x: 100, y: 0 })
      closeTo(points[1], { x: 100, y: 100 })
      closeTo(points[2], { x: 0, y: 100 })
      closeTo(points[3], { x: 0, y: 0 })
      expect(isConvex(points)).to.be.true
    })

    it('scales the top and bottom edges against each other', () => {
      let points = adjust(corners(SOURCE), { vertical: 20 })

      expect(measure(points).vertical).to.be.closeTo(20, 1e-6)
      closeTo(points[0], { x: -10, y: 0 })
      closeTo(points[1], { x: 110, y: 0 })
      closeTo(points[2], { x: 90, y: 100 })
      closeTo(points[3], { x: 10, y: 100 })
    })

    it('scales the left and right edges against each other', () => {
      let points = adjust(corners(SOURCE), { horizontal: -20 })

      expect(measure(points).horizontal).to.be.closeTo(-20, 1e-6)
      closeTo(points[0], { x: 0, y: -10 })
      closeTo(points[1], { x: 100, y: 10 })
      closeTo(points[2], { x: 100, y: 90 })
      closeTo(points[3], { x: 0, y: 110 })
    })

    it('fits the quad into the source', () => {
      let points = adjust(corners(SOURCE), { rotate: 45 })
      expect(fit(points, SOURCE)).to.not.eql(points)

      let fitted = fit(points, SOURCE)
      let m = measure(fitted)

      expect(m.rotate).to.be.closeTo(45, 1e-6)
      expect(m.vertical).to.be.closeTo(0, 1e-6)

      for (let { x, y } of fitted) {
        expect(x).to.be.within(-1e-6, 100 + 1e-6)
        expect(y).to.be.within(-1e-6, 100 + 1e-6)
      }

      // The diagonal of the turned square spans the source
      expect(Math.max(...fitted.map(p => p.x))).to.be.closeTo(100, 1e-6)
      expect(Math.min(...fitted.map(p => p.y))).to.be.closeTo(0, 1e-6)

      expect(fit(initial(SOURCE), SOURCE)).to.eql(initial(SOURCE))
    })

    it('leaves the other values alone', () => {
      let points = parse(TRAPEZOID)
      let before = measure(points)
      let after = measure(adjust(points, { rotate: 5 }))

      expect(after.rotate).to.be.closeTo(5, 1e-6)
      expect(after.vertical).to.be.closeTo(before.vertical, 1e-6)
      expect(after.horizontal).to.be.closeTo(before.horizontal, 1e-6)

      expect(adjust(points, {})).to.eql(points)
    })
  })

  describe('keystone', () => {
    it('is the identity without corners', () => {
      for (let params of [{}, { keystone: null }, { keystone: '' }]) {
        let k = keystone(params, SOURCE)

        expect(k.matrix).to.equal(IDENTITY)
        expect(k.keystone).to.be.null
        expect(k.corners).to.be.null
        expect(k.bounds).to.eql({ x: 0, y: 0, width: 100, height: 100 })
        expect(k.project({ x: 3, y: 4 })).to.eql({ x: 3, y: 4 })
      }
    })

    it('is the identity for the corners of the source', () => {
      let value = '[0,0,100,0,100,100,0,100]'
      let k = keystone({ keystone: value }, SOURCE)

      expect(k.matrix).to.equal(IDENTITY)
      expect(k.keystone).to.equal(value)
      expect(k.corners).to.eql(corners(SOURCE))
      expect(k.bounds).to.eql({ x: 0, y: 0, width: 100, height: 100 })
    })

    it('ignores corners which cannot be corrected', () => {
      let k = keystone({ keystone: '[0,0,0,0,0,0,0,0]' }, SOURCE)
      expect(k.matrix).to.equal(IDENTITY)
      expect(k.corners).to.be.null
      expect(k.keystone).to.be.null
    })

    it('keeps the corners', () => {
      for (let value of [ROTATED, TRAPEZOID]) {
        let k = keystone({ keystone: value }, { width: 100, height: 35 })
        expect(k.keystone).to.equal(value)
        expect(k.corners).to.eql(parse(value))
      }
    })

    it('maps a centred rectangle onto the photo itself', () => {
      let k = keystone({ keystone: '[25,25,75,25,75,75,25,75]' }, SOURCE)

      expect(k.matrix).to.not.equal(IDENTITY)
      expect(k.bounds).to.eql({ x: 0, y: 0, width: 100, height: 100 })
      closeTo(k.project({ x: 25, y: 25 }), { x: 25, y: 25 })
      closeTo(k.project({ x: 100, y: 100 }), { x: 100, y: 100 })
    })

    it('turns the image with the corners', () => {
      let k = keystone({ keystone: ROTATED }, { width: 100, height: 35 })

      // The turned image is 35x100; the crop around it keeps the
      // photo's 100x35 aspect ratio, so the image is letterboxed.
      closeTo(k.bounds, { x: 43.875, y: 0 })
      expect(k.bounds.width).to.be.closeTo(12.25, 1e-6)
      expect(k.bounds.height).to.be.closeTo(35, 1e-6)

      closeTo(k.project({ x: 0, y: 0 }), { x: 56.125, y: 0 })
      closeTo(k.project({ x: 50, y: 17.5 }), { x: 50, y: 17.5 })
    })

    it('straightens the document inside the photo', () => {
      let k = keystone({ keystone: TRAPEZOID }, SOURCE)
      let [tl, tr, br, bl] = parse(TRAPEZOID).map(k.project)

      // The document is a rectangle ...
      expect(tl.y).to.be.closeTo(tr.y, 1e-6)
      expect(bl.y).to.be.closeTo(br.y, 1e-6)
      expect(tl.x).to.be.closeTo(bl.x, 1e-6)
      expect(tr.x).to.be.closeTo(br.x, 1e-6)

      // ... inside the corrected image ...
      for (let p of [tl, tr, br, bl]) {
        expect(p.x).to.be.within(-1e-6, 100)
        expect(p.y).to.be.within(-1e-6, 100)
      }

      // ... and the warped photo extends beyond it.
      expect(k.bounds.x).to.be.below(0)
      expect(k.bounds.x + k.bounds.width).to.be.above(100)
    })

    it('round-trips through the inverse', () => {
      let k = keystone({ keystone: TRAPEZOID }, SOURCE)

      for (let p of [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 33, y: 71 }]) {
        closeTo(k.unproject(k.project(p)), p)
      }
    })

    it('limits the extent of the photo', () => {
      // A document seen from a steep angle: the photo's top corners
      // lie behind the camera.
      let value = '[40,45,60,45,100,100,0,100]'
      let k = keystone({ keystone: value }, SOURCE)

      expect(k.bounds.width).to.be.below(5 * 100 + 1e-6)
      expect(k.bounds.height).to.be.below(5 * 100 + 1e-6)

      for (let p of parse(value).map(k.project)) {
        expect(p.x).to.be.within(-1e-6, 100)
        expect(p.y).to.be.within(-1e-6, 100)
      }
    })

    it('compares corrections', () => {
      expect(equals({}, { keystone: null })).to.be.true
      expect(equals({ keystone: TRAPEZOID }, { keystone: TRAPEZOID })).to.be.true
      expect(equals({ keystone: TRAPEZOID }, { keystone: ROTATED })).to.be.false
    })

    // The frame, crop and limit are part of the file format;
    // this pins them down.
    it('matches the reference values', () => {
      let k = keystone({
        keystone: '[200,150,3700,100,3900,2950,100,2800]'
      }, { width: 4000, height: 3000 })

      closeTo(k.project({ x: 200, y: 150 }), REFERENCE[0], 1e-3)
      closeTo(k.project({ x: 4000, y: 3000 }), REFERENCE[1], 1e-3)
      closeTo(k.bounds, REFERENCE[2], 1e-3)
    })
  })
})

const REFERENCE = [
  { x: 69.845, y: 44.083 },
  { x: 4021.126, y: 2999.151 },
  { x: -175.377, y: -139.313, width: 4420.523, height: 3301.3 }
]
