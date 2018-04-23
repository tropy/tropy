'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { array, bool, func, object, string } = require('prop-types')
const { TitleBar } = require('../titlebar')
const { TemplateEditor } = require('../template')
const { VocabPane } = require('../vocab')
const { PrefPane, PrefPaneToggle } = require('./pane')
const { AppPrefs } = require('./app')
const { PluginsPane } = require('../plugin')
const actions = require('../../actions')
const { win } = require('../../window')

const {
  getItemTemplates,
  getVocabs
} = require('../../selectors')

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
      <div
        className="prefs"
        onContextMenu={this.props.onContextMenu}>
        <header className="prefs-header window-draggable">
          {this.renderTitleBar()}
          <nav className="prefs-nav">
            <ul>
              <li>
                <PrefPaneToggle
                  name="app"
                  icon="IconTropy"
                  isActive={this.isActive('app')}
                  onClick={this.toggle}/>
              </li>
              {/*<li>
                <PrefPaneToggle
                  name="project"
                  icon="IconMaze32"
                  isActive={this.isActive('project')}
                  isDisabled
                  onClick={this.toggle}/>
              </li>*/}
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
                  icon="IconBook"
                  isActive={this.isActive('vocab')}
                  onClick={this.toggle}/>
              </li>
              <li>
                <PrefPaneToggle
                  name="plugins"
                  icon="IconPlugin"
                  isActive={this.isActive('plugins')}
                  onClick={this.toggle}/>
              </li>
            </ul>
          </nav>
        </header>
        <div className="prefs-body">
          <PrefPane
            name="app"
            isActive={this.isActive('app')}>
            <AppPrefs
              templates={this.props.itemTemplates}
              settings={this.props.settings}
              onSettingsUpdate={this.props.onSettingsUpdate}/>
          </PrefPane>

          <PrefPane
            name="project"
            isActive={this.isActive('project')}/>

          <PrefPane
            name="template"
            isActive={this.isActive('template')}>
            <TemplateEditor/>
          </PrefPane>

          <VocabPane
            isActive={this.isActive('vocab')}
            vocab={this.props.vocab}
            onClassSave={this.props.onClassSave}
            onDelete={this.props.onVocabDelete}
            onExport={this.props.onVocabExport}
            onImport={this.props.onOntologyImport}
            onOpenLink={this.props.onOpenLink}
            onPropsSave={this.props.onPropsSave}
            onSave={this.props.onVocabSave}/>

          <PluginsPane
            name="plugins"
            plugins={this.props.plugins}
            onUninstall={this.props.onPluginUninstall}
            onOpenLink={this.props.onOpenLink}
            isActive={this.isActive('plugins')}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    edit: object.isRequired,
    isFrameless: bool,
    itemTemplates: array.isRequired,
    pane: string.isRequired,
    settings: object.isRequired,
    vocab: array.isRequired,
    plugins: object.isRequired,
    onClassSave: func.isRequired,
    onContextMenu: func.isRequired,
    onOpenLink: func.isRequired,
    onPrefsUpdate: func.isRequired,
    onPropsSave: func.isRequired,
    onSettingsUpdate: func.isRequired,
    onVocabDelete: func.isRequired,
    onVocabExport: func.isRequired,
    onVocabSave: func.isRequired,
    onOntologyImport: func.isRequired,
    onPluginUninstall: func.isRequired
  }

  static defaultProps = {
    isFrameless: ARGS.frameless,
    plugins: win.plugins
  }
}

module.exports = {
  PrefsContainer: connect(
    state => ({
      edit: state.edit,
      itemTemplates: getItemTemplates(state),
      keymap: state.keymap,
      pane: state.prefs.pane,
      project: state.project,
      settings: state.settings,
      vocab: getVocabs(state)
    }),

    dispatch => ({
      onClassSave(...args) {
        dispatch(actions.ontology.class.save(...args))
      },

      onContextMenu(event) {
        event.stopPropagation()
        dispatch(actions.context.show(event))
      },

      onOpenLink(...args) {
        dispatch(actions.shell.openLink(args))
      },

      onPrefsUpdate(...args) {
        dispatch(actions.prefs.update(...args))
      },

      onPropsSave(...args) {
        dispatch(actions.ontology.props.save(...args))
      },

      onSettingsUpdate(...args) {
        dispatch(actions.settings.update(...args))
      },

      onVocabDelete(...args) {
        dispatch(actions.ontology.vocab.delete(...args))
      },

      onVocabExport(...args) {
        dispatch(actions.ontology.vocab.export(...args))
      },

      onVocabSave(...args) {
        dispatch(actions.ontology.vocab.save(...args))
      },

      onOntologyImport() {
        dispatch(actions.ontology.import())
      },

      onPluginUninstall(...args) {
        dispatch(actions.plugin.uninstall(...args))
      }
    })
  )(PrefsContainer)
}
