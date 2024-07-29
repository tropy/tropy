import React from 'react'
import { diff } from '../common/util.js'


export function pure(WrappedComponent) {
  return class extends React.PureComponent {
    static displayName = `pure(${WrappedComponent.name})`

    static get WrappedComponent() {
      return WrappedComponent
    }

    render() {
      return React.createElement(WrappedComponent, this.props)
    }
  }
}

export function createClickHandler({
  onClick,
  onSingleClick,
  onDoubleClick
}, delay = 350) {
  let timeout
  let cancelled

  return function handleClick(event) {
    // Handle only clicks with the left/primary button!
    if (event.button) return

    if (timeout) {
      if (onDoubleClick && !cancelled)
        onDoubleClick(event)

      timeout = clearTimeout(timeout)
      cancelled = false

    } else {
      if (onClick) cancelled = onClick(event)

      timeout = setTimeout(() => {
        if (onSingleClick && !cancelled)
          onSingleClick(event)

        timeout = null
        cancelled = false

      }, delay)

      if (onSingleClick && !cancelled) {
        event.persist()
      }
    }
  }
}
