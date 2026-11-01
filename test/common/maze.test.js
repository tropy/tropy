import { maze } from '#tropy/common/maze.js'

describe('maze', () => {
  const A = '6f1c2a9e-3b4d-4e8f-9a1b-2c3d4e5f6a7b'
  const B = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

  it('is the same for the same seed', () => {
    expect(maze(A).toPath()).to.equal(maze(A).toPath())
    expect(maze(A).toPath()).not.to.equal(maze(B).toPath())
  })

  it('is a perfect maze', () => {
    let grid = maze(A)
    let links = grid.cells.reduce((sum, cell) => sum + cell.links.size, 0)

    let seen = new Set([grid.cells[0]])
    for (let cell of seen) {
      for (let other of cell.links) seen.add(other)
    }

    // 49 cells, 48 passages between them, all connected:
    // so no cell is cut off and there are no loops.
    expect(links).to.equal(2 * 48)
    expect(seen.size).to.equal(49)
  })
})
