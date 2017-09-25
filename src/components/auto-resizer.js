'use strict'

const React = require('react')
const { PureComponent } = React
const { element, number, oneOfType, string } = require('prop-types')


class AutoResizer extends PureComponent {
  render() {
    return (
      <div className="auto-resizer">
        <div className="content">{this.props.content}</div>
        {this.props.children}
      </div>
    )
  }

  static propTypes = {
    children: element.isRequired,
    content: oneOfType([string, number])
  }
}


module.exports = {
  AutoResizer
}
