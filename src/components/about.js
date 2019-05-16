'use strict'

const React = require('react')
const { FormattedMessage, injectIntl, intlShape } = require('react-intl')
const { shell } = require('electron')
const { product, version } = require('../common/release')
const { Titlebar } = require('./toolbar')


class About extends React.PureComponent {
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
      <div className="about-view">
        <Titlebar isOptional/>
        <figure className="app-icon"/>
        <div className="flex-row center">
          <h1><span className="product">{product}</span></h1>
          <p className="version">
            <FormattedMessage id="about.version" values={{ version }}/>
          </p>
          <p>
            <FormattedMessage
              id="about.text"
              values={{ rrchnm: this.renderLink('about.rrchnm') }}/>
          </p>
          <p>
            <FormattedMessage
              id="about.trademark"
              values={{ cds: this.renderLink('about.cds') }}/>
          </p>
          <p className="links">
            {this.renderLink('about.release', { version })}
            {this.renderLink('about.license')}
            {this.renderLink('about.credits')}
          </p>
        </div>
      </div>
    )
  }

  static propTypes = {
    intl: intlShape.isRequired,
  }
}

module.exports = {
  About: injectIntl(About)
}
