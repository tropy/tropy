import { createSelector as memo } from 'reselect'
import { into, compose, map, filter } from 'transducers.js'
import { isExpired } from '../slices/completed.js'

const values = ([, value]) => value
const busy = compose(map(values), filter(a => !a.done && !a.hidden))


export const getActivities = memo(
  ({ activities }) => activities,
  (activities) => into([], busy, activities)
)

export const getCompletedActivities = memo(
  ({ completed }) => completed,
  (_, now) => now,
  (runs, now) => {
    let types = new Map()

    for (let run of runs) {
      if (isExpired(run, now)) continue

      let a = types.get(run.type)

      if (!a) {
        a = {
          type: run.type,
          init: run.init,
          refs: new Set(),
          errors: 0,
          cancelled: false,
          agent: false
        }
        types.set(run.type, a)
      }

      a.init = Math.min(a.init, run.init)
      a.done = run.done
      a.errors += run.errors ?? 0
      a.cancelled ||= !!run.cancelled
      a.agent ||= !!run.agent

      for (let id of run.refs ?? []) a.refs.add(id)
    }

    return Array.from(types.values(), ({ refs, ...a }) => ({
      ...a,
      refs: [...refs],
      count: refs.size
    })).sort((a, b) => b.done - a.done)
  }
)

export const getLastCompleted = ({ completed }) =>
  completed.at(-1)
