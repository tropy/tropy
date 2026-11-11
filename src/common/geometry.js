import { json, stringify as toJSON } from './util.js'

export const parse = (polygon) =>
  ((typeof polygon === 'string') ? json(polygon) : polygon)
    ?.map(([x, y]) => ({ x, y })) ?? null

export const stringify = (polygon) =>
  toJSON(polygon?.map(({ x, y }) => [x, y]))

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

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  }
}

export const translate = (points, { x = 0, y = 0 }) =>
  points.map(p => ({ x: p.x + x, y: p.y + y }))


export const flatten = (points) =>
  points.flatMap(({ x, y }) => [x, y])
