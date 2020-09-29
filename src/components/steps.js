import React from 'react'
import { node, number } from 'prop-types'


export class Step extends React.PureComponent {
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

export class Steps extends React.PureComponent {
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
