'use strict'

const React = require('react')
const { PureComponent } = React
const { node, number } = require('prop-types')


class Step extends PureComponent {
  render() {
    return (
      <div className="step">
        {this.props.children}
      </div>
    )
  }

  static propTypes = {
    children: node.isRequired
  }
}

class Steps extends PureComponent {
  render() {
    return (
      <div className="steps">
        {this.props.children}
      </div>
    )
  }

  static propTypes = {
    current: number,
    children: node
  }

  static defaultProps = {
    current: 1
  }
}


module.exports = {
  Step,
  Steps
}
