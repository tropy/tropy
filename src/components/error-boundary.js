
'use strict'

const React = require('react')
const { Component } = React
const { node } = require('prop-types')
const { warn } = require('../common/log')


class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true })
    warn(`Uncaught UI error: ${error.message}`, { error, info })
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }
    return this.props.children
  }

  static propTypes = {
    children: node.isRequired
  }
}

module.exports = {
  ErrorBoundary
}
