import { useEffect, useSyncExternalStore } from 'react'

// Using module-level shared clock,
// to ensure components filter activities the same!

let now = Date.now()
let due = Infinity
let timeout
let listeners = new Set()

// Longest delay setTimeout supports.
const MAX_DELAY = 2 ** 31 - 1

function tick (at) {
  if (at >= due) return

  clearTimeout(timeout)
  due = at

  timeout = setTimeout(() => {
    due = Infinity
    now = Date.now()
    for (let fn of listeners) fn()
  }, Math.min(MAX_DELAY, Math.max(0, at - Date.now() + 1)))
}

function subscribe (fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getNow () {
  return now
}

export function useNow () {
  return useSyncExternalStore(subscribe, getNow)
}

// Advances the shared clock once `at` has passed.
export function useTick (at, now) {
  useEffect(() => {
    if (Number.isFinite(at)) tick(at)
  }, [now, at])
}
