'use strict'

const React = require('react')
const { PureComponent } = React
const { array, arrayOf, bool, func, shape, string } = require('prop-types')
const { TemplateSelect } = require('../template/select')
const { ipcRenderer: ipc } = require('electron')
const { ESPER } = require('../../constants')

const {
  FormElement,
  FormSelect,
  FormToggle,
  FormToggleGroup,
  Toggle
} = require('../form')


class AppPrefs extends PureComponent {
  handleDebugChange() {
    ipc.send('cmd', 'app:toggle-debug-flag')
  }

  handleThemeChange = ({ theme }) => {
    ipc.send('cmd', 'app:switch-theme', theme)
  }

  handleLocaleChange = ({ locale }) => {
    ipc.send('cmd', 'app:switch-locale', locale)
  }

  handleTemplateChange = (template) => {
    this.props.onSettingsUpdate({ template: template.id })
  }

  render() {
    return (
      <div className="scroll-container">
        <div className="form-horizontal">
          <FormElement id="prefs.app.template">
            <TemplateSelect
              isRequired
              options={this.props.templates}
              value={this.props.settings.template}
              tabIndex={0}
              onChange={this.handleTemplateChange}/>
          </FormElement>
          <hr/>
          <FormToggleGroup
            id="prefs.app.dup"
            name="dup"
            value={this.props.settings.dup}
            options={this.props.dupOptions}
            onChange={this.props.onSettingsUpdate}/>
          <hr/>
          <FormSelect
            id="prefs.app.style.theme"
            name="theme"
            isRequired
            value={this.props.settings.theme}
            options={this.props.themes}
            onChange={this.handleThemeChange}/>
          <hr/>
          <FormSelect
            id="prefs.app.locale.locale"
            name="locale"
            isRequired
            value={this.props.settings.locale}
            options={this.props.locales}
            tabIndex={0}
            onChange={this.handleLocaleChange}/>
          <hr/>
          <FormElement
            id="prefs.app.ui.label"
            isCompact>
            <Toggle
              id="prefs.app.ui.option.invertScroll"
              name="invertScroll"
              value={this.props.settings.invertScroll}
              onChange={this.props.onSettingsUpdate}/>
            <Toggle
              id="prefs.app.ui.option.invertZoom"
              name="invertZoom"
              value={this.props.settings.invertZoom}
              onChange={this.props.onSettingsUpdate}/>
            <Toggle
              id="prefs.app.ui.option.overlayToolbars"
              name="overlayToolbars"
              value={this.props.settings.overlayToolbars}
              onChange={this.props.onSettingsUpdate}/>
          </FormElement>
          <FormToggleGroup
            id="prefs.app.zoomMode"
            name="zoomMode"
            value={this.props.settings.zoomMode}
            options={this.props.zoomModes}
            onChange={this.props.onSettingsUpdate}/>
          <hr/>
          <FormToggle
            id="prefs.app.debug"
            name="debug"
            isDisabled={ARGS.dev}
            value={this.props.settings.debug || ARGS.dev}
            onChange={this.handleDebugChange}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    templates: array.isRequired,
    settings: shape({
      debug: bool.isRequired,
      locale: string.isRequired,
      theme: string.isRequired,
    }).isRequired,
    locales: arrayOf(string).isRequired,
    themes: arrayOf(string).isRequired,
    dupOptions: arrayOf(string).isRequired,
    zoomModes: arrayOf(string).isRequired,
    onSettingsUpdate: func.isRequired
  }

  static defaultProps = {
    themes: ['light', 'dark'],
    locales: ['de', 'en', 'fr', 'ja'],
    dupOptions: ['skip', 'import', 'prompt'],
    zoomModes: [ESPER.MODE.FIT, ESPER.MODE.FILL]
  }
}


module.exports = {
  AppPrefs
}
