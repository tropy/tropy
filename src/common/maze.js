import { Seeded } from './math.js'

/*
 * Generates a 7x7 maze from a UUID
 * using the Recursive Backtracker algorithm.
 *
 * Read "Mazes for Programmers" by Jamis Buck
 * for more maze algorithms!
 */

export function maze (uuid = crypto.randomUUID()) {
  return recursiveBacktracker(
    new Grid(7),
    new Seeded(Uint8Array.fromHex(uuid.replaceAll('-', ''))))
}

function recursiveBacktracker (grid, random) {
  let stack = [sample(grid.cells, random)]

  while (stack.length > 0) {
    let current = stack.at(-1)
    let neighbors = [
      ...current.neighbors().filter(n => n && n.links.size === 0)
    ]

    if (neighbors.length === 0) {
      stack.pop()
    } else {
      stack.push(current.link(sample(neighbors, random)))
    }
  }

  return grid
}

function sample (cells, random) {
  return cells[random.int(0, cells.length - 1)]
}

class Grid {
  constructor (rows = 0, columns = rows) {
    this.rows = rows
    this.columns = columns

    this.cells = Array.from({ length: rows * columns }, (_, i) =>
      new Cell(i % columns, Math.floor(i / columns), this))
  }

  at (x, y) {
    if (x >= 0 && x < this.columns && y >= 0 && y < this.rows)
      return this.cells[y * this.columns + x]
  }

  // Yields each line of a (2 × size + 1) raster.
  *lines () {
    let entrance = Math.floor(this.columns / 2)

    yield [true, ...this.cells.slice(0, this.columns)
      .flatMap(cell => [cell.x !== entrance, true])]

    for (let y = 0; y < this.rows; ++y) {
      let row = this.cells.slice(y * this.columns, (y + 1) * this.columns)
      let exit = y === this.rows - 1

      yield [true, ...row.flatMap(cell =>
        [false, !cell.canReach(1, 0)])]

      yield [true, ...row.flatMap(cell =>
        [!cell.canReach(0, 1) && !(exit && cell.x === entrance), true])]
    }
  }

  toPath () {
    let d = ''

    this.lines().forEach((walls, y) => {
      for (let x = 0; x < walls.length; ++x) {
        if (!walls[x]) continue

        let w = 1
        while (walls[x + w]) ++w

        d += `M${x + 1},${y}h${w}v1h${-w}z`
        x += w
      }
    })

    return d
  }

  toString ({ post = '+', horizontal = '---', vertical = '|' } = {}) {
    let blank = ' '.repeat(horizontal.length)
    let gap = ' '.repeat(vertical.length)

    return this
      .lines()
      .map((walls, y) => walls.map((wall, x) => (y % 2) ?
        ((x % 2) ? blank : wall ? vertical : gap) :
        ((x % 2) ? (wall ? horizontal : blank) : post)).join(''))
      .reduce((prev, next) => `${prev}\n${next}`)
  }
}

class Cell {
  links = new Set()

  constructor (x = 0, y = 0, grid) {
    this.x = x
    this.y = y
    this.grid = grid
  }

  link (cell, bidi = true) {
    this.links.add(cell)
    if (bidi) cell.link(this, false)

    return cell
  }

  neighbor (dx, dy) {
    return this.grid.at(this.x + dx, this.y + dy)
  }

  *neighbors () {
    yield this.neighbor(0, -1)
    yield this.neighbor(1, 0)
    yield this.neighbor(0, 1)
    yield this.neighbor(-1, 0)
  }

  canReach (dx, dy) {
    return this.links.has(this.neighbor(dx, dy))
  }
}
