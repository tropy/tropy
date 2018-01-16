'use strict'

const React = require('react')
const { Component } = React
const { bool } = require('prop-types')


class EsperPanel extends Component {
  get classes() {
    return ['esper', super.classes]
  }

  render() {
    return (
      <div className="esper panel"/>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isHidden: bool
  }
}

module.exports = {
  EsperPanel
}
