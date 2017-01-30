'use strict'

const { Children, PropTypes } = require('react')
const { get, move } = require('../common/util')
const { assign } = Object


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

  createClickHandler({ onClick, onSingleClick, onDoubleClick }, delay = 350) {
    let tid

    return function handleClick(event) {
      // Handle only clicks with the left/primary button!
      if (event.button) return

      if (tid) {
        tid = clearTimeout(tid), undefined
        if (onDoubleClick) onDoubleClick(event)

      } else {
        tid = setTimeout(() => {
          tid = undefined

          if (onSingleClick && !event.isPropagationStopped()) {
            onSingleClick(event)
          }
        }, delay)

        event.persist()
        if (onClick) onClick(event)
      }
    }
  },

  sortable(component, props, propName = 'order') {

    component.state = {
      ...component.state,
      order: get(props, propName) || []
    }

    component.handleMove = function (item, to, offset = 0) {
      this.setState({
        order: move(this.state.order, item, to, offset)
      })
    }.bind(component)

    component.handleMoveReset = function () {
      this.setState({
        order: get(this.props, propName) || []
      })
    }.bind(component)

    component.handleMoveCommit = function () {
      const { onSort } = this.props
      if (onSort) onSort(this.state.order)
    }.bind(component)

    return component
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
