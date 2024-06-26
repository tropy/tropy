import React from 'react'
import { bool, number, shape, string } from 'prop-types'
import { diff } from '../common/util'


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

export function only(type) {
  return (props, name, component) => {
    let error

    React.Children.forEach(props[name], node => {
      if (error) return

      const actual = node.type.DecoratedComponent || node.type

      if (actual === type) return
      if (actual.prototype instanceof type) return
      if (actual.WrappedComponent &&
        actual.WrappedComponent.prototype instanceof type) return

      error = new Error(
        `${component} accepts only ${type.displayName || type.name} nodes as children.`
      )
    })

    return error
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

export function why(component, props, state) {
  const name = component.constructor.name

  const dp = diff(component.props, props)
  const ds = diff(component.state, state)

  // eslint-disable-next-line no-console
  console.log(`${name}: [${ds.join(', ')}] [${dp.join(', ')}]`)
}

export const shapes = {
  point: shape({
    x: number.isRequired,
    y: number.isRequired
  }),

  number(min, max, required = true) {
    return (props, name, component) => {
      let value = props[name]

      if (required && value == null) {
        throw new Error(`Missing prop '${name}' for ${component}`)
      }

      if (typeof value !== 'number' || value < min || value > max) {
        throw new Error(
          `Invalid prop '${name}' supplied to ${component}. Out of bounds.`
        )
      }
    }
  },

  field: shape({
    isExtra: bool.isRequired,
    property: shape({
      id: string.isRequired
    }).isRequired
  }),

  subject: shape({
    id: number.isRequired,
    template: string
  }),

  template: shape({
    id: string.isRequired,
    mixed: bool
  })
}
