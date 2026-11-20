import { tropy, xsd } from './ns.js'

export const text = xsd.string
export const date = tropy.date
export const number = xsd.integer

export function classify (type) {
  switch (type) {
    case date:
      return 'date'
    case number:
      return 'number'
    default:
      return 'text'
  }
}
