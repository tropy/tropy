'use strict'

const React = require('react')
const { Component } = React
const { object } = require('prop-types')


class Plugins extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <div className="scroll-container">
        Hello
      </div>
    )
  }

  static propTypes = {
    plugins: object.isRequired
  }
}

module.exports = {
  Plugins
}
