'use strict'

const { Children, PropTypes } = require('react')
const { diff } = require('../common/util')

module.exports = {

  only(type) {
    return (props, name, component) => {
      let error

      Children.forEach(props[name], node => {
        if (error) return

        const actual = node.type.DecoratedComponent || node.type

        if (actual === type) return
        if (actual.prototype instanceof type) return

        error = new Error(
          `${component} accepts only ${type.displayName || type.name} nodes as children.`
        )
      })

      return error
    }
  },

  createClickHandler({ onClick, onSingleClick, onDoubleClick }, delay = 350) {
    let tid

    return function handleClick(event) {
      // Handle only clicks with the left/primary button!
      if (event.button) return

      if (tid) {
        tid = clearTimeout(tid), undefined
        if (onDoubleClick) onDoubleClick(event)

      } else {
        let cancelled = false

        if (onClick) cancelled = onClick(event)
        if (onSingleClick && !cancelled) {
          event.persist()

          tid = setTimeout(() => {
            tid = undefined

            if (onSingleClick) {
              onSingleClick(event)
            }
          }, delay)
        }
      }
    }
  },

  why(component, props, state) {
    const name = component.constructor.name

    const dp = diff(component.props, props)
    const ds = diff(component.state, state)

    // eslint-disable-next-line no-console
    console.log(`${name}: [${ds.join(', ')}] [${dp.join(', ')}]`)
  },

  Shapes: {
    edge: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),

    number(min, max, required = true) {
      return (props, name, component) => {
        const value = props[name]

        if (required && value == null) {
          throw new Error(`Missing prop '${name}' for ${component}`)
        }

        if (typeof value !== 'number' || value < min || value > max) {
          throw new Error(
            `Invalid prop '${name}' supplied to ${component}. Out of bounds.`
          )
        }
      }
    }
  }
}
