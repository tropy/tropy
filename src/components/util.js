'use strict'

const {
  Children, PureComponent, createElement: create
} = require('react')

const { diff } = require('../common/util')


module.exports = {

  pure(WrappedComponent) {
    return class extends PureComponent {
      static displayName = `pure(${WrappedComponent.name})`

      static get WrappedComponent() {
        return WrappedComponent
      }

      render() {
        return create(WrappedComponent, this.props)
      }
    }
  },

  only(type) {
    return (props, name, component) => {
      let error

      Children.forEach(props[name], node => {
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
  },

  createClickHandler({ onClick, onSingleClick, onDoubleClick }, delay = 350) {
    let tid

    return function handleClick(event) {
      let cancelled = false

      // Handle only clicks with the left/primary button!
      if (event.button) return

      if (tid) {
        tid = clearTimeout(tid), undefined
        if (onDoubleClick) onDoubleClick(event)

      } else {
        tid = setTimeout(() => {
          tid = undefined

          if (onSingleClick && !cancelled) {
            onSingleClick(event)
          }
        }, delay)

        if (onClick) cancelled = onClick(event)

        if (!cancelled && onSingleClick) {
          event.persist()
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
