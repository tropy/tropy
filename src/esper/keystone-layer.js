import { Circle, Container, Graphics } from 'pixi.js'
import { ESPER } from '../constants/index.js'
import {
  apply, initial, isConvex, parse, squareToQuad
} from './keystone.js'

// Marks a drag of one of the corners, see Esper#handleMouseDown.
export const KEYSTONE_TOOL = 'keystone'

// The radius of a corner's handle, in screen pixels; and that of
// its hit area, which is larger so that a handle on the edge of the
// view can still be picked up.
const RADIUS = 6
const HIT_RADIUS = 3 * RADIUS

// The number of cells per side of the grid shown while dragging.
const GRID = 6

// Shows the four corners of the correction on the uncorrected photo
// and lets the user drag them. Subtle: when the corners are visible,
// the photo is drawn without its correction, so that the local
// coordinates are texture pixels!
export class KeystoneLayer extends Container {
  constructor () {
    super()

    this.points = null
    this.visible = false

    // Subtle: only the handles respond to the pointer; otherwise the
    // dimmed area would be the target of clicks (and of pan drags)
    // instead of the photo!
    this.outline = new Graphics()
    this.outline.eventMode = 'none'
    this.addChild(this.outline)

    this.handles = []

    for (let i = 0; i < 4; ++i) {
      this.handles.push(this.addChild(new KeystoneHandle(i)))
    }
  }

  destroy () {
    this.points = null
    this.outline = null
    this.handles = null
    super.destroy({ children: true })
  }

  sync (props, state) {
    this.visible = !!state.isKeystoneVisible && props.selection == null
    this.eventMode = (this.visible && !props.isReadOnly) ? 'static' : 'none'

    if (!this.visible) {
      this.points = null
      return
    }

    let { source } = this.parent.correction
    let points = parse(state.keystone)

    this.points = (points != null && isConvex(points)) ?
      points :
      initial(source)
  }

  update (drag) {
    let isDragging = drag?.tool === KEYSTONE_TOOL
    let points = isDragging ? drag.points : this.points
    let { outline, handles } = this

    outline.clear()

    if (points == null || this.parent == null)
      return

    let scale = 1 / this.parent.scale.y
    let { x, y, width, height } = this.parent.correction.bounds

    outline
      .rect(x, y, width, height)
      .fill(ESPER.COLOR.mask.fill)
      .poly(points, true)
      .cut()
      .poly(points, true)
      .stroke({ width: scale, ...ESPER.COLOR.keystone.line })

    if (isDragging)
      grid(outline, points, scale)

    for (let i = 0; i < 4; ++i) {
      handles[i].position.copyFrom(points[i])
      handles[i].scale.set(scale)
    }
  }
}

// Draws a grid across the quad, in perspective: the lines are
// evenly spaced on the unit square and mapped onto the quad, so
// they show how the correction will straighten it.
function grid (g, points, scale) {
  let m = squareToQuad(points)

  for (let i = 1; i < GRID; ++i) {
    let t = i / GRID

    let a = apply(m, { x: t, y: 0 })
    let b = apply(m, { x: t, y: 1 })
    let c = apply(m, { x: 0, y: t })
    let d = apply(m, { x: 1, y: t })

    g.moveTo(a.x, a.y).lineTo(b.x, b.y)
    g.moveTo(c.x, c.y).lineTo(d.x, d.y)
  }

  g.stroke({ width: scale, ...ESPER.COLOR.keystone.grid })
}

export class KeystoneHandle extends Graphics {
  constructor (index) {
    super()

    this.index = index
    this.eventMode = 'static'
    this.cursor = 'move'
    this.hitArea = new Circle(0, 0, HIT_RADIUS)

    this
      .circle(0, 0, RADIUS)
      .fill(ESPER.COLOR.keystone.fill)
      .stroke({ width: 1.5, ...ESPER.COLOR.keystone.line })
  }
}
