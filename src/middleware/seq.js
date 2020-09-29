import { counter } from '../common/util'

export function seq() {
  let q = counter()

  return next => action => {
    action.meta = {
      ...action.meta,
      seq: q.next().value,
      now: Date.now()
    }

    return next(action)
  }
}
