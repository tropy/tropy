'use strict'

const React = require('react')
const { PureComponent } = React
const { FormattedMessage, injectIntl, intlShape } = require('react-intl')
const { shell } = require('electron')


class About extends PureComponent {
  renderLink(id) {
    const url = this.props.intl.formatMessage({ id: `${id}.url` })
    const title = this.props.intl.formatMessage({ id: `${id}.title` })

    return (
      // eslint-disable-next-line react/jsx-no-bind
      <a onClick={() => shell.openExternal(url)}>{title}</a>
    )
  }

  render() {
    return (
      <div className="about">
        <FormattedMessage id="about.tropy"/>

        <FormattedMessage
          id="about.text"
          values={{ rrchnm: this.renderLink('about.rrchnm') }}/>
        <FormattedMessage
          id="about.trademark"
          values={{ cds: this.renderLink('about.cds') }}/>

        {this.renderLink('about.changelog')}
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
