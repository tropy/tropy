'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { array, bool, func, object, string } = require('prop-types')
const { TitleBar } = require('../titlebar')
const { TemplateEditor } = require('../template/editor')
const { PrefPane, PrefPaneToggle } = require('./pane')
const actions = require('../../actions')
const { getItemTemplates, getAllProperties } = require('../../selectors')


class PrefsContainer extends PureComponent {
  isActive(pane) {
    return this.props.pane === pane
  }

  renderTitleBar() {
    return (!this.props.isFrameless) ? null : (
      <TitleBar title="prefs.title"/>
    )
  }

  toggle = (pane) => {
    this.props.onPrefsUpdate({ pane })
  }

  render() {
    return (
      <div className="prefs">
        <header className="prefs-header draggable">
          {this.renderTitleBar()}
          <nav className="prefs-nav">
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
              properties={this.props.properties}
              templates={this.props.templates}
              onSave={this.props.onTemplateSave}
              onCreate={this.props.onTemplateCreate}/>
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
    edit: object.isRequired,
    pane: string.isRequired,
    properties: array.isRequired,
    templates: array.isRequired,
    onPrefsUpdate: func.isRequired,
    onTemplateCreate: func.isRequired,
    onTemplateSave: func.isRequired
  }

  static defaultProps = {
    isFrameless: ARGS.frameless
  }
}

module.exports = {
  PrefsContainer: connect(
    state => ({
      edit: state.edit,
      project: state.project,
      keymap: state.keymap,
      pane: state.prefs.pane,
      properties: getAllProperties(state),
      templates: getItemTemplates(state)
    }),

    dispatch => ({
      onPrefsUpdate(...args) {
        dispatch(actions.prefs.update(...args))
      },

      onTemplateCreate() {
      },

      onTemplateSave() {
      }
    })
  )(PrefsContainer)
}
