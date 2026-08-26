import Esper from '#tropy/esper/index.js'
import { Photo } from '#tropy/esper/photo.js'

// Fakes the transform of a photo container: rotation is applied
// around the origin, then the result is scaled and translated.
const photo = ({ x = 0, y = 0, zoom = 1, angle = 0 } = {}) => ({
  x,
  y,
  toGlobal ({ x: lx, y: ly }) {
    let sin = Math.round(Math.sin(angle * Math.PI / 180))
    let cos = Math.round(Math.cos(angle * Math.PI / 180))

    return {
      x: x + (lx * cos - ly * sin) * zoom,
      y: y + (lx * sin + ly * cos) * zoom
    }
  },
  getScreenBounds: Photo.prototype.getScreenBounds
})

const rect = (x, y, width = 10, height = 10) => ({ x, y, width, height })

// Reveals the rectangle in a 100x100 view, returning the position the
// photo was moved to, or null if the rectangle was visible already.
const reveal = (current, target, opts) => {
  let view = {
    photo: current,
    app: { screen: { x: 0, y: 0, width: 100, height: 100 } },
    moved: null,
    reveal: Esper.prototype.reveal,
    move (position) {
      this.moved = position
    }
  }

  view.reveal(target, opts)

  return view.moved
}

describe('esper', () => {
  describe('getScreenBounds', () => {
    it('projects photo coordinates onto the screen', () => {
      expect(photo({ x: 5, y: 7, zoom: 2 }).getScreenBounds(rect(1, 2)))
        .to.eql({ left: 7, top: 11, right: 27, bottom: 31 })
    })

    it('takes rotation into account', () => {
      expect(photo({ angle: 90 }).getScreenBounds(rect(0, 0, 10, 4)))
        .to.eql({ left: -4, top: 0, right: 0, bottom: 10 })
    })
  })

  describe('reveal', () => {
    it('does nothing without a rectangle', () => {
      expect(reveal(photo(), null)).to.be.null
    })

    it('does nothing without a photo', () => {
      expect(reveal(null, rect(500, 500))).to.be.null
    })

    it('does nothing if the rectangle is visible', () => {
      expect(reveal(photo(), rect(20, 20))).to.be.null
    })

    it('pans up if the rectangle is below the view', () => {
      expect(reveal(photo(), rect(20, 120))).to.eql({ x: 0, y: -30 })
    })

    it('pans down if the rectangle is above the view', () => {
      expect(reveal(photo({ y: -100 }), rect(20, 20)))
        .to.eql({ x: 0, y: -20 })
    })

    it('pans horizontally, too', () => {
      expect(reveal(photo(), rect(-20, 20))).to.eql({ x: 20, y: 0 })
    })

    it('centers rectangles which do not fit', () => {
      expect(reveal(photo(), rect(0, 0, 200, 200)))
        .to.eql({ x: -50, y: -50 })
    })

    it('keeps the padding to the edge of the view', () => {
      expect(reveal(photo(), rect(20, 120), { padding: 20 }))
        .to.eql({ x: 0, y: -50 })
    })

    it('keeps the padding of a single edge', () => {
      expect(reveal(photo(), rect(20, 10), { padding: { top: 20 } }))
        .to.eql({ x: 0, y: 10 })
    })
  })
})
