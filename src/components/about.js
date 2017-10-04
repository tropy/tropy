'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage, injectIntl, intlShape } = require('react-intl')
const { shell } = require('electron')
const { version } = require('../common/release')


class About extends PureComponent {
  renderLink(id, ...options) {
    const { intl } = this.props

    const url = intl.formatMessage({ id: `${id}.url` }, ...options)
    const title = intl.formatMessage({ id: `${id}.title` }, ...options)

    return (
      // eslint-disable-next-line react/jsx-no-bind
      <a onClick={() => shell.openExternal(url)}>{title}</a>
    )
  }

  render() {
    return (
      <div className="about">
        <FormattedMessage id="about.tropy"/>

        <span className="version">{version}</span>

        <FormattedMessage
          id="about.text"
          values={{ rrchnm: this.renderLink('about.rrchnm') }}/>
        <FormattedMessage
          id="about.trademark"
          values={{ cds: this.renderLink('about.cds') }}/>

        {this.renderLink('about.release', { version })}
        {this.renderLink('about.license')}
        {this.renderLink('about.credits')}

      </div>
    )
  }

  static propTypes = {
    intl: intlShape.isRequired
  }
}

module.exports = {
  About: injectIntl(About)
}
