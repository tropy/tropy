'use strict'

const React = require('react')
const { wrapInTestContext } = require('react-dnd-test-utils')

const wrap = (DecoratedComponent) =>
  wrapInTestContext((props) =>
    <DecoratedComponent {...props}/>)

module.exports = {
  wrap
}
