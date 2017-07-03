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
const actions = require('../../actions')

const {
  getTemplates,
  getAllProperties,
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
        <header className="prefs-header draggable">
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
              <li>
                <PrefPaneToggle
                  name="project"
                  icon="IconMaze32"
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
                  icon="IconBook"
                  isActive={this.isActive('vocab')}
                  onClick={this.toggle}/>
              </li>
            </ul>
          </nav>
        </header>
        <main>
          <PrefPane
            name="app"
            isActive={this.isActive('app')}>
            <AppPrefs/>
          </PrefPane>


          <PrefPane
            name="project"
            isActive={this.isActive('project')}/>

          <PrefPane
            name="template"
            isActive={this.isActive('template')}>
            <TemplateEditor
              properties={this.props.properties}
              templates={this.props.templates}
              onCreate={this.props.onTemplateCreate}
              onDelete={this.props.onTemplateDelete}
              onImport={this.props.onTemplateImport}
              onSave={this.props.onTemplateSave}/>
          </PrefPane>

          <VocabPane
            isActive={this.isActive('vocab')}
            vocab={this.props.vocab}
            onClassSave={this.props.onClassSave}
            onDelete={this.props.onVocabDelete}
            onImport={this.props.onOntologyImport}
            onOpenLink={this.props.onOpenLink}
            onPropsSave={this.props.onPropsSave}
            onSave={this.props.onVocabSave}/>
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
    vocab: array.isRequired,
    onClassSave: func.isRequired,
    onContextMenu: func.isRequired,
    onOpenLink: func.isRequired,
    onPrefsUpdate: func.isRequired,
    onPropsSave: func.isRequired,
    onTemplateCreate: func.isRequired,
    onTemplateDelete: func.isRequired,
    onTemplateImport: func.isRequired,
    onTemplateSave: func.isRequired,
    onVocabDelete: func.isRequired,
    onVocabSave: func.isRequired,
    onOntologyImport: func.isRequired
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
      templates: getTemplates(state),
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

      onTemplateCreate(...args) {
        dispatch(actions.ontology.template.create(...args))
      },

      onTemplateDelete(...args) {
        dispatch(actions.ontology.template.delete(...args))
      },

      onTemplateImport() {
        dispatch(actions.ontology.template.import())
      },

      onTemplateSave(...args) {
        dispatch(actions.ontology.template.save(...args))
      },

      onVocabDelete(...args) {
        dispatch(actions.ontology.vocab.delete(...args))
      },

      onVocabSave(...args) {
        dispatch(actions.ontology.vocab.save(...args))
      },

      onOntologyImport() {
        dispatch(actions.ontology.import())
      }
    })
  )(PrefsContainer)
}
