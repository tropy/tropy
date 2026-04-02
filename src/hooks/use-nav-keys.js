import { indexOf, sanitize } from '../common/collection.js'

export function useNavKeys (items, active) {
  let next = (offset = 1) => {
    if (active != null)
      return items[sanitize(
        items.length,
        indexOf(items, active) + offset,
        'bounds')]
    else
      return items[0]
  }

  let prev = (offset = 1) => {
    if (active != null)
      return next(-offset)
    else
      return items.at(-1)
  }

  let current = () => next(0)

  return {
    current,
    next,
    prev
  }
}
