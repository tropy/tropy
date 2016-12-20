'use strict'

const { Children, PropTypes } = require('react')

module.exports = {

  only(type) {
    return (props, name, component) => {
      let error

      Children.forEach(props[name], node => {
        if (error) return

        if (node.type !== type) {
          error = new Error(
            `${component} accepts only ${type.displayName || type} nodes as children.`
          )
        }
      })

      return error
    }
  },

  clickable(component, delay = 350) {
    let tm

    function clear() {
      clearTimeout(tm)
      tm = undefined
    }

    function set(action) {
      tm = setTimeout(() => {
        tm = undefined
        action()
      }, delay)

    }

    function handle(which, ...args) {
      const handler = component[`handle${which}`] ||
        component.props[`on${which}`]

      if (handler) handler.call(component, ...args)
    }

    function click(event) {
      if (tm) {
        clear()
        handle('DoubleClick', event)

      } else {
        event.persist()

        set(() => {
          if (!event.isPropagationStopped()) {
            handle('SingleClick', event)
          }
        })

        handle('Click', event)
      }
    }

    component.click = click.bind(component)
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
