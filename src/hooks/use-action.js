import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { get } from '../common/util.js'
import * as act from '../actions/index.js'

export function useActions(actions) {
  let dispatch = useDispatch()

  return useMemo(() => (
    actions.map(action => createHandler(dispatch, action))
  ), [dispatch]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function useAction(dispatch, action) {
  return useMemo(() => (
    createHandler(dispatch, action)
  ), [dispatch, action])
}

function createHandler(dispatch, action) {
  let fn = resolve(action)

  return (...args) => {
    dispatch(fn(...args))
  }
}

function resolve(action) {
  if (typeof action === 'function')
    return action

  let fn = get(act, action)

  if (!fn)
    throw new Error(`failed to resolve action: ${action}`)

  return fn
}

