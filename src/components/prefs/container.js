'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { array, bool, func, string } = require('prop-types')
const { TitleBar } = require('../titlebar')
const { TemplateEditor } = require('../template/editor')
const { PrefPane, PrefPaneToggle } = require('./pane')
const actions = require('../../actions')
const { getItemTemplates } = require('../../selectors')


class PrefsContainer extends PureComponent {
  isActive(pane) {
    return this.props.pane === pane
  }

  renderTitleBar() {
    return (!this.props.isFrameless) ? null : (
      <TitleBar title="preferences.title"/>
    )
  }

  toggle = (pane) => {
    this.props.onPrefsUpdate({ pane })
  }

  render() {
    return (
      <div className="preferences">
        <header className="preferences-header draggable">
          {this.renderTitleBar()}
          <nav className="preference-nav">
            <ul>
              <li>
                <PrefPaneToggle
                  name="app"
                  isActive={this.isActive('app')}
                  isDisabled
                  onClick={this.toggle}/>
              </li>
              <li>
                <PrefPaneToggle
                  name="project"
                  isActive={this.isActive('project')}
                  isDisabled
                  onClick={this.toggle}/>
              </li>
              <li>
                <PrefPaneToggle
                  name="template"
                  icon="IconTemplate"
                  isActive={this.isActive('template')}
                  onClick={this.toggle}/>
              </li>
              <li>
                <PrefPaneToggle
                  name="vocab"
                  isActive={this.isActive('vocab')}
                  onClick={this.toggle}/>
              </li>
            </ul>
          </nav>
        </header>
        <main>
          <PrefPane
            name="app"
            isActive={this.isActive('app')}/>

          <PrefPane
            name="project"
            isActive={this.isActive('project')}/>

          <PrefPane
            name="template"
            isActive={this.isActive('template')}>
            <TemplateEditor
              templates={this.props.templates}
              onTemplateChange={this.props.onTemplateChange}/>
          </PrefPane>

          <PrefPane
            name="vocab"
            isActive={this.isActive('vocab')}/>
        </main>
      </div>
    )
  }

  static propTypes = {
    isFrameless: bool,
    pane: string.isRequired,
    templates: array.isRequired,
    onPrefsUpdate: func.isRequired,
    onTemplateChange: func.isRequired
  }

  static defaultProps = {
    isFrameless: ARGS.frameless
  }
}

module.exports = {
  PrefsContainer: connect(
    state => ({
      project: state.project,
      keymap: state.keymap,
      pane: state.prefs.pane,
      properties: state.properties,
      templates: getItemTemplates(state)
    }),

    dispatch => ({
      onPrefsUpdate(...args) {
        dispatch(actions.prefs.update(...args))
      },

      onTemplateChange() {
      }
    })
  )(PrefsContainer)
}
