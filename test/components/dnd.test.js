import {
  getDropDepth,
  getDropPosition,
  isNoopMove
} from '#tropy/components/dnd.js'

describe('drop positions', () => {
  let rect = { top: 100, left: 10, width: 200, height: 30 }

  describe('getDropPosition', () => {
    for (let [y, expected] of [
      [100, 'before'], [114, 'before'], [115, 'after'], [130, 'after']
    ]) {
      it(`halves: y=${y} is ${expected}`, () => {
        expect(getDropPosition({ x: 50, y }, rect)).to.equal(expected)
      })
    }

    for (let [y, expected] of [
      [105, 'before'], [115, 'on'], [125, 'after']
    ]) {
      it(`thirds: y=${y} is ${expected}`, () => {
        expect(getDropPosition({ x: 50, y }, rect, { on: true }))
          .to.equal(expected)
      })
    }

    it('grids: by x', () => {
      expect(getDropPosition({ x: 50, y: 0 }, rect, { isGrid: true }))
        .to.equal('before')
      expect(getDropPosition({ x: 150, y: 0 }, rect, { isGrid: true }))
        .to.equal('after')
    })
  })

  describe('isNoopMove', () => {
    // Order 1, 2, 3: moving 2 (adjacent 1 and 3).
    let move = (position, target) =>
      isNoopMove(position, { id: 2, target, adjacent: [1, 3] })

    for (let [position, target, expected] of [
      ['before', 2, true],
      ['after', 2, true],
      ['after', 1, true],
      ['before', 3, true],
      ['before', 1, false],
      ['after', 3, false]
    ]) {
      it(`${position} ${target}: ${expected}`, () => {
        expect(move(position, target)).to.equal(expected)
      })
    }
  })

  describe('getDropDepth', () => {
    let options = { depth: 3, indent: 20, padding: 5 }

    for (let [x, expected] of [
      [0, 0], [15, 0], [35, 1], [55, 2], [500, 3]
    ]) {
      it(`x=${x} is depth ${expected}`, () => {
        expect(getDropDepth({ x }, rect, options)).to.equal(expected)
      })
    }
  })
})
