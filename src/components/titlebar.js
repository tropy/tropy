'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage } = require('react-intl')
const { string } = require('prop-types')

class TitleBar extends PureComponent {
  render() {
    return (
      <div className="titlebar draggable">
        <FormattedMessage id={this.props.title}/>
      </div>
    )
  }

  static propTypes = {
    title: string.isRequired
  }
}

module.exports = {
  TitleBar
}
