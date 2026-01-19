import { useEvent } from './use-event.js'
import { indexOf, sanitize } from '../common/collection.js'

export function useNavControls(items, {
  active,
  onSelect
}) {
  let first = useEvent(() => items.at(0))

  let last = useEvent(() => items.at(-1))

  let next = useEvent((offset = 1) => {
    console.log('next', offset, indexOf(items, active))
    if (active != null) {
      return items[sanitize(
        items.length,
        indexOf(items, active) + offset,
        'bounds')]
    } else {
      return first()
    }
  })

  let prev = useEvent((offset = 1) => {
    if (active != null) {
      return next(-offset)
    } else {
      return last()
    }
  })

  let current = useEvent(() => next(0))

  let isActive = useEvent((id) => active === id)

  let select = useEvent((item) => {
    if (item != null && !isActive(item.id)) {
      onSelect(item)
    }
  })

  return {
    first,
    last,
    next,
    prev,
    current,
    isActive,
    select
  }
}
