import { useEffect, useSyncExternalStore } from 'react'
import { useSelector } from 'react-redux'
import { getActivities } from '../../selectors/index.js'

// Using module-level shared clock,
// to ensure components filter activities the same!

let NOW = Date.now()
let DUE = Infinity
let TIMEOUT
let LISTENERS = new Set()

function tick (at) {
  if (at >= DUE) return

  clearTimeout(TIMEOUT)
  DUE = at
  TIMEOUT = setTimeout(() => {
    DUE = Infinity
    NOW = Date.now()
    for (let fn of LISTENERS) fn()
  }, Math.max(0, at - Date.now() + 1))
}

function subscribe (fn) {
  LISTENERS.add(fn)
  return () => LISTENERS.delete(fn)
}

function getNow () {
  return NOW
}

export function useBusyActivities (delay = 400) {
  let activities = useSelector(getActivities)
  let now = useSyncExternalStore(subscribe, getNow)

  let busy = activities.filter(activity => (now - activity.init) > delay)

  // When the next pending activity exceeds the delay.
  let next = Math.min(
    ...activities
      .map(activity => activity.init + delay)
      .filter(due => due >= now))

  useEffect(() => {
    if (Number.isFinite(next)) tick(next)
  }, [now, next])

  return busy
}
