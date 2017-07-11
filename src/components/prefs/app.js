'use strict'

const React = require('react')
const { PureComponent } = React
const { arrayOf, func, shape, string } = require('prop-types')
const { FormSelect } = require('../form')
const { ipcRenderer: ipc } = require('electron')


class AppPrefs extends PureComponent {
  handleThemeChange = ({ theme }) => {
    ipc.send('cmd', 'app:switch-theme', theme, theme)
  }

  render() {
    return (
      <div className="scroll-container">
        <div className="form-horizontal">
          <FormSelect
            id="prefs.app.style.theme"
            name="theme"
            value={this.props.settings.theme}
            options={this.props.themes}
            onChange={this.handleThemeChange}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    settings: shape({
      theme: string.isRequired,
    }).isRequired,
    themes: arrayOf(string).isRequired,
    onSettingsUpdate: func.isRequired
  }

  static defaultProps = {
    themes: ['light', 'dark']
  }
}


module.exports = {
  AppPrefs
}
