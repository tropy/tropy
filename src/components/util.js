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

  Shapes: {
    edge: PropTypes.oneOf(['top', 'right', 'bottom', 'left'])
  }
}
