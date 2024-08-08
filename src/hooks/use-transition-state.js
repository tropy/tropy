import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import cx from 'classnames'
import { ensure, reflow } from '../dom.js'

// This can be used for complex transitions of a prop change.
// Returns the `state` and object.
// Set `ref` and `state.className` on the DOM element that will transition.
// Use `timeout` to set the fallback timeout.
// Use `toString` parameter to customize how prop values are mapped in `state.className`.

export function useTransitionState(node, prop, timeout = 1000, toString) {
  let [state, setState] = useState({
    current: prop,
    isChanging: false,
    next: prop
  })

  let handleTransitionEnd = useMemo(() =>
    () => {
      setState(({ next }) => ({
        current: next,
        isChanging: false,
        next
      }))
    }
  , [])

  if (state.next !== prop) {
    setState({ ...state, next: prop })
  }

  let willChange = state.current !== state.next
  let className = getClassNames(state, toString)

  useLayoutEffect(() => {
    if (willChange) {
      if (node.current) {
        reflow(node.current)
        setState(s => ({ ...s, isChanging: true }))

        ensure(
          node.current,
          'transitionend',
          handleTransitionEnd,
          timeout,
          event => event.target.parentNode === node.current)

      } else {
        handleTransitionEnd()
      }
    }
  }, [willChange, handleTransitionEnd, timeout])

  return {
    ...state,
    className,
    willChange
  }
}

const getClassNames = (state, toString) => {
  let current = stringify(state.current, toString)

  if (state.current === state.next)
    return current

  let next = stringify(state.next, toString)

  return cx(current, {
    [`${current}-leave`]: true,
    [`${current}-leave-active`]: state.isChanging,
    [`${next}-enter`]: true,
    [`${next}-enter-active`]: state.isChanging
  })
}

const stringify = (prop, toString) =>
  toString?.(prop) || prop?.toString()

