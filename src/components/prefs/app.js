'use strict'

const React = require('react')
const { PureComponent } = React
const { arrayOf, func, string } = require('prop-types')
const { FormattedMessage } = require('react-intl')
const { FormSelect } = require('../form')


class AppPrefs extends PureComponent {
  handleThemeChange = ({ theme }) => {
    this.props.onThemeChange(theme)
  }

  render() {
    return (
      <div className="form-horizontal">
        <header>
          <FormattedMessage id="prefs.app.style.label"/>
        </header>
        <FormSelect
          id="prefs.app.style.theme"
          name="theme"
          value={this.props.theme}
          options={this.props.themes}
          onChange={this.handleThemeChange}/>
      </div>
    )
  }

  static propTypes = {
    theme: string.isRequired,
    themes: arrayOf(string).isRequired,
    onThemeChange: func.isRequired
  }

  static defaultProps = {
    themes: ['light', 'dark']
  }
}


module.exports = {
  AppPrefs
}
