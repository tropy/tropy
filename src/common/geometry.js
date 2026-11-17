export const rectangle = ({ x, y, width, height }) => [
  [x, y],
  [x + width, y],
  [x + width, y + height],
  [x, y + height]
]

export const isRectangle = (points) =>
  points.length === 4 && points.every(([x, y], i) => {
    let [nx, ny] = points[(i + 1) % 4]
    return (x === nx) !== (y === ny)
  })

export const translate = (points, { x = 0, y = 0 }) =>
  points.map(([px, py]) => [px + x, py + y])

export const round = (points) =>
  points.map(([x, y]) => [Math.round(x), Math.round(y)])

export const isClosed = (points) =>
  points.length > 1 &&
  points[0][0] === points.at(-1)[0] &&
  points[0][1] === points.at(-1)[1]

export const close = (points) =>
  isClosed(points) ? points : [...points, points[0]]

export const open = (points) =>
  isClosed(points) ? points.slice(0, -1) : points
