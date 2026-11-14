import { useEffect, useSyncExternalStore } from 'react'

// Using module-level shared clock,
// to ensure components filter activities the same!

let NOW = Date.now()
let DUE = Infinity
let TIMEOUT
let LISTENERS = new Set()

const MAX_DELAY = 2 ** 31 - 1

function tick (at) {
  if (at >= DUE) return

  clearTimeout(TIMEOUT)
  DUE = at

  TIMEOUT = setTimeout(() => {
    DUE = Infinity
    NOW = Date.now()
    for (let fn of LISTENERS) fn()
  }, Math.min(MAX_DELAY, Math.max(0, at - Date.now() + 1)))
}

function subscribe (fn) {
  LISTENERS.add(fn)
  return () => LISTENERS.delete(fn)
}

function getNow () {
  return NOW
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
