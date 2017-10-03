'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage } = require('react-intl')


class About extends PureComponent {
  render() {
    return (
      <div className="about">
        <FormattedMessage id="about.tropy"/>
      </div>
    )
  }
}

module.exports = {
  About
}
