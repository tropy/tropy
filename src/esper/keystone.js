// Perspective ("keystone") correction.
//
// An image's correction is given by four corners in texture pixels,
// in the order top-left, top-right, bottom-right, bottom-left:
// typically the corners of a document in the photo. The correction
// maps this quad onto a rectangle, the frame, which has the quad's
// centre and the average lengths of its opposite edges, so that a
// rectangular quad maps onto itself.
//
// The corrected image has the same size as the photo: it is the
// largest rectangle with the photo's aspect ratio, centred on the
// frame, which fits into the warped photo (but never smaller than
// the frame), scaled to the photo's size. Esper also draws what
// lies around it, as far as it stays within reasonable bounds.
//
// The corners are stored as a JSON array of eight numbers,
// [x0, y0, x1, y1, x2, y2, x3, y3], or null for no correction.
//
// NB: the frame, the crop and the limit are part of the file format.
// Changing them would change the meaning of every stored correction!
//
// Matrices are 3x3, stored row-major in plain arrays.

export const KEYSTONE = {
  keystone: null
}

export const IDENTITY = Object.freeze([1, 0, 0, 0, 1, 0, 0, 0, 1])

// The crop and the drawn extent reach at most this many times the
// frame's size beyond the frame, on each side.
const LIMIT = 2

export function multiply (a, b) {
  let m = new Array(9)

  for (let r = 0; r < 3; ++r)
    for (let c = 0; c < 3; ++c)
      m[r * 3 + c] =
        a[r * 3] * b[c] +
        a[r * 3 + 1] * b[3 + c] +
        a[r * 3 + 2] * b[6 + c]

  return m
}

export function invert (m) {
  let [a, b, c, d, e, f, g, h, i] = m

  let A = e * i - f * h
  let B = f * g - d * i
  let C = d * h - e * g

  let det = a * A + b * B + c * C

  return [
    A / det, (c * h - b * i) / det, (b * f - c * e) / det,
    B / det, (a * i - c * g) / det, (c * d - a * f) / det,
    C / det, (b * g - a * h) / det, (a * e - b * d) / det
  ]
}

// Applies the projective transform to a point.
export function apply (m, { x, y }) {
  let w = m[6] * x + m[7] * y + m[8]

  return {
    x: (m[0] * x + m[1] * y + m[2]) / w,
    y: (m[3] * x + m[4] * y + m[5]) / w
  }
}

export const corners = ({ x = 0, y = 0, width, height }) => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height }
]

export function bounds (points) {
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity

  for (let { x, y } of points) {
    if (x < left) left = x
    if (x > right) right = x
    if (y < top) top = y
    if (y > bottom) bottom = y
  }

  return { x: left, y: top, width: right - left, height: bottom - top }
}

// Returns the four corners of a stored correction, or null.
export function parse (value) {
  if (value == null || value === '')
    return null

  try {
    let v = JSON.parse(value)

    if (Array.isArray(v) && v.length === 8 && v.every(Number.isFinite))
      return [
        { x: v[0], y: v[1] },
        { x: v[2], y: v[3] },
        { x: v[4], y: v[5] },
        { x: v[6], y: v[7] }
      ]

  } catch {
    // Not valid JSON
  }

  return null
}

// Returns the stored form of the corners, rounded to hundredths of
// a pixel: fine enough for the sliders' smallest steps to register.
export function stringify (points) {
  if (points == null)
    return null

  return JSON.stringify(points.flatMap(p => [round(p.x), round(p.y)]))
}

const round = (n) => Math.round(n * 100) / 100

// True if the points are the corners of the source.
const isWhole = (points, source) =>
  corners({ x: 0, y: 0, ...source })
    .every((c, i) => c.x === points[i].x && c.y === points[i].y)

// True if the quad is convex and its corners are given in order
// (clockwise, with the y-axis facing down): only then can it be
// corrected.
export function isConvex (points) {
  if (points?.length !== 4)
    return false

  for (let i = 0; i < 4; ++i) {
    let a = points[i]
    let b = points[(i + 1) % 4]
    let c = points[(i + 2) % 4]

    let cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)

    if (!(cross > 0))
      return false
  }

  return true
}

const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

const center = ({ x, y, width, height }) =>
  ({ x: x + width / 2, y: y + height / 2 })

const deg = (rad) => rad * 180 / Math.PI
const rad = (deg) => deg * Math.PI / 180

// Without a correction, the corners start on the photo's corners.
export const initial = ({ width, height }) =>
  corners({ x: 0, y: 0, width, height })

// Returns the slider values of a quad: its rotation (the tilt of the
// line through the midpoints of its left and right edges, in degrees,
// clockwise) and its vertical and horizontal perspective (how much
// wider the top edge is than the bottom edge, and the right edge
// taller than the left one, in percent of their sum). These are
// exact for symmetric trapezoids and a fair approximation otherwise.
export function measure ([a, b, c, d]) {
  let left = mid(a, d)
  let right = mid(b, c)

  let top = dist(a, b)
  let bottom = dist(d, c)
  let lh = dist(a, d)
  let rh = dist(b, c)

  return {
    rotate: deg(Math.atan2(right.y - left.y, right.x - left.x)),
    vertical: 100 * (top - bottom) / (top + bottom),
    horizontal: 100 * (rh - lh) / (rh + lh)
  }
}

const rotateAbout = (p, c, t) => ({
  x: c.x + (p.x - c.x) * Math.cos(t) - (p.y - c.y) * Math.sin(t),
  y: c.y + (p.x - c.x) * Math.sin(t) + (p.y - c.y) * Math.cos(t)
})

const scaleAbout = (p, c, k) => ({
  x: c.x + (p.x - c.x) * k,
  y: c.y + (p.y - c.y) * k
})

// Returns the quad scaled down about its centre, if necessary, so
// that it lies within the source. The shape (and thus the slider
// values) stays the same.
export function fit (points, { width, height }) {
  let [a, b, c, d] = points
  let o = mid(mid(a, b), mid(d, c))
  let k = 1

  for (let p of points) {
    let dx = p.x - o.x
    let dy = p.y - o.y

    if (dx < 0) k = Math.min(k, o.x / -dx)
    if (dx > 0) k = Math.min(k, (width - o.x) / dx)
    if (dy < 0) k = Math.min(k, o.y / -dy)
    if (dy > 0) k = Math.min(k, (height - o.y) / dy)
  }

  return (k < 1) ? points.map(p => scaleAbout(p, o, k)) : points
}

// Returns the quad adjusted to the given slider values (see
// `measure`): rotated about its centre, its top and bottom edges
// scaled about their midpoints (keeping their sum), and likewise
// its left and right edges. Values left out are kept as they are.
export function adjust (points, { rotate, vertical, horizontal }) {
  let current = measure(points)
  let [a, b, c, d] = points

  if (rotate != null && rotate !== current.rotate) {
    let o = mid(mid(a, b), mid(d, c))
    let t = rad(rotate - current.rotate);
    [a, b, c, d] = [a, b, c, d].map(p => rotateAbout(p, o, t))
  }

  if (vertical != null && vertical !== current.vertical) {
    let sum = dist(a, b) + dist(d, c)
    let top = sum * (1 + vertical / 100) / 2
    let bottom = sum - top
    let mt = mid(a, b)
    let mb = mid(d, c)
    let kt = top / dist(a, b)
    let kb = bottom / dist(d, c)

    a = scaleAbout(a, mt, kt)
    b = scaleAbout(b, mt, kt)
    c = scaleAbout(c, mb, kb)
    d = scaleAbout(d, mb, kb)
  }

  if (horizontal != null && horizontal !== current.horizontal) {
    let sum = dist(a, d) + dist(b, c)
    let right = sum * (1 + horizontal / 100) / 2
    let left = sum - right
    let ml = mid(a, d)
    let mr = mid(b, c)
    let kl = left / dist(a, d)
    let kr = right / dist(b, c)

    a = scaleAbout(a, ml, kl)
    d = scaleAbout(d, ml, kl)
    b = scaleAbout(b, mr, kr)
    c = scaleAbout(c, mr, kr)
  }

  return [a, b, c, d]
}

// Returns the frame of the corners: the rectangle they are mapped to.
export function frame ([a, b, c, d]) {
  let width = (dist(a, b) + dist(d, c)) / 2
  let height = (dist(a, d) + dist(b, c)) / 2

  let cx = (a.x + b.x + c.x + d.x) / 4
  let cy = (a.y + b.y + c.y + d.y) / 4

  return { x: cx - width / 2, y: cy - height / 2, width, height }
}

// Returns the matrix which maps the unit square onto the quad.
// See Heckbert, Fundamentals of Texture Mapping and Image Warping.
export function squareToQuad ([p0, p1, p2, p3]) {
  let sx = p0.x - p1.x + p2.x - p3.x
  let sy = p0.y - p1.y + p2.y - p3.y

  if (sx === 0 && sy === 0)
    return [
      p1.x - p0.x, p3.x - p0.x, p0.x,
      p1.y - p0.y, p3.y - p0.y, p0.y,
      0, 0, 1
    ]

  let dx1 = p1.x - p2.x
  let dx2 = p3.x - p2.x
  let dy1 = p1.y - p2.y
  let dy2 = p3.y - p2.y

  let det = dx1 * dy2 - dx2 * dy1
  let g = (sx * dy2 - dx2 * sy) / det
  let h = (dx1 * sy - sx * dy1) / det

  return [
    p1.x - p0.x + g * p1.x, p3.x - p0.x + h * p3.x, p0.x,
    p1.y - p0.y + g * p1.y, p3.y - p0.y + h * p3.y, p0.y,
    g, h, 1
  ]
}

// Returns the homography which maps the corners onto the frame,
// in texture pixels.
export function homography (points, rect) {
  if (points == null)
    return IDENTITY

  rect ??= frame(points)

  return multiply(squareToQuad(corners(rect)), invert(squareToQuad(points)))
}

function intersect (a, b) {
  let x = Math.max(a.x, b.x)
  let y = Math.max(a.y, b.y)

  return {
    x,
    y,
    width: Math.min(a.x + a.width, b.x + b.width) - x,
    height: Math.min(a.y + a.height, b.y + b.height) - y
  }
}

const inflate = ({ x, y, width, height }, by) => ({
  x: x - by * width,
  y: y - by * height,
  width: (1 + 2 * by) * width,
  height: (1 + 2 * by) * height
})

// Returns the photo's corners, projected through H; or null if any
// of them lies behind the camera.
function project (H, source) {
  let points = corners({ x: 0, y: 0, ...source })

  if (!points.every(({ x, y }) => H[6] * x + H[7] * y + H[8] > 0))
    return null

  return points.map(p => apply(H, p))
}

// Returns the largest rectangle with the source's aspect ratio,
// centred on the frame, which fits into the projected photo (a
// convex quad), the limit permitting; but never smaller than the
// frame.
export function crop (rect, photo, source, limit = inflate(rect, LIMIT)) {
  let { width, height } = source
  let c = center(rect)

  let min = Math.max(rect.width / width, rect.height / height)
  let max = Math.min(limit.width / width, limit.height / height)

  if (photo != null) {
    let m = center(bounds(photo))

    for (let i = 0; i < 4; ++i) {
      let a = photo[i]
      let b = photo[(i + 1) % 4]

      // The edge's normal, facing inwards
      let n = { x: a.y - b.y, y: b.x - a.x }

      if (n.x * (m.x - a.x) + n.y * (m.y - a.y) < 0) {
        n.x = -n.x
        n.y = -n.y
      }

      let offset = n.x * (c.x - a.x) + n.y * (c.y - a.y)

      for (let d of corners({ x: -width / 2, y: -height / 2, width, height })) {
        let nd = n.x * d.x + n.y * d.y

        if (nd < 0)
          max = Math.min(max, offset / -nd)
      }
    }
  }

  let s = Math.max(min, max)

  return {
    x: c.x - s * width / 2,
    y: c.y - s * height / 2,
    width: s * width,
    height: s * height
  }
}

// Returns the correction of a photo, given its texture size.
//
// The result maps texture pixels to corrected pixels: `matrix` and
// `project` go from texture pixels to corrected pixels, `inverse` and
// `unproject` the other way round. The corrected image has the size
// of the source; `bounds` is the extent of the whole warped photo in
// corrected pixels, i.e., of what Esper draws. `matrix` is IDENTITY
// itself if there is no correction.
export function keystone (params = KEYSTONE, source) {
  let points = parse(params.keystone)

  if (points != null && !isConvex(points))
    points = null

  let matrix = IDENTITY
  let extent = { x: 0, y: 0, ...source }

  // Corners on the photo's own corners mean no correction, but they
  // are kept, so that they stay where the user left them.
  if (points != null && !isWhole(points, source)) {
    let rect = frame(points)
    let H = homography(points, rect)
    let limit = inflate(rect, LIMIT)
    let photo = project(H, source)
    let box = crop(rect, photo, source, limit)

    // Scale the crop to the source's size
    let s = source.width / box.width
    let T = [s, 0, -box.x * s, 0, s, -box.y * s, 0, 0, 1]

    matrix = multiply(T, H)

    extent = (photo == null) ? limit : intersect(bounds(photo), limit)
    extent = {
      x: (extent.x - box.x) * s,
      y: (extent.y - box.y) * s,
      width: extent.width * s,
      height: extent.height * s
    }
  }

  let inverse = invert(matrix)

  return {
    keystone: (points == null) ? null : params.keystone,
    corners: points,
    source,
    matrix,
    inverse,
    bounds: extent,
    project: (p) => apply(matrix, p),
    unproject: (p) => apply(inverse, p)
  }
}

// True if the two corrections have the same values.
export const equals = (a = KEYSTONE, b = KEYSTONE) =>
  (a.keystone ?? null) === (b.keystone ?? null)
