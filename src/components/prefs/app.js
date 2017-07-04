'use strict'

const React = require('react')
const { PureComponent } = React
const { arrayOf, string } = require('prop-types')
const { FormSelect } = require('../form')
const { win } = require('../../window')
const { ipcRenderer: ipc } = require('electron')


class AppPrefs extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      theme: win.state.theme
    }
  }

  componentDidMount() {
    win.on('style.update', this.handleStyleUpdate)
  }

  componentWillUnmount() {
    win.removeListener('style.update', this.handleStyleUpdate)
  }

  handleStyleUpdate = () => {
    this.setState({ theme: win.state.theme })
  }

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
            value={this.state.theme}
            options={this.props.themes}
            onChange={this.handleThemeChange}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    themes: arrayOf(string).isRequired
  }

  static defaultProps = {
    themes: ['light', 'dark']
  }
}


module.exports = {
  AppPrefs
}
