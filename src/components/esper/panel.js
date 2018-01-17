'use strict'

const React = require('react')
const { Component } = React
const { bool } = require('prop-types')
const cx = require('classnames')


class EsperPanel extends Component {
  get classes() {
    return ['esper', 'panel', {
      show: this.props.isVisible
    }]
  }

  render() {
    return (
      <div className={cx(this.classes)}/>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isVisible: bool
  }
}

module.exports = {
  EsperPanel
}
