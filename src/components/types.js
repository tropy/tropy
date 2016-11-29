'use strict'

const { PropTypes } = require('react')

module.exports = {
  orientation: PropTypes.oneOf([
    'top', 'right', 'bottom', 'left'
  ])
}
