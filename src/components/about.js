'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage, injectIntl, intlShape } = require('react-intl')
const { shell } = require('electron')
const { product, version } = require('../common/release')
const { bool } = require('prop-types')
const { Toolbar } = require('./toolbar')


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

  renderToolbar() {
    return this.props.showToolbar && <Toolbar/>
  }

  render() {
    return (
      <div className="about view">
        {this.renderToolbar()}
        <figure className="app-icon"/>
        <div className="flex-row center">
          <h1><span class="product">{product}</span></h1>
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
    showToolbar: bool.isRequired
  }

  static defaultProps = {
    showToolbar: ARGS.frameless
  }
}

module.exports = {
  About: injectIntl(About)
}
