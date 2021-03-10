import React from 'react'
import { connect } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { array, func, object, string } from 'prop-types'
import { Titlebar } from '../toolbar'
import { TemplateEditor } from '../template'
import { VocabPane } from '../vocab'
import { PrefPane, PrefPaneToggle } from './pane'
import { AppPrefs } from './app'
import { ProjectPrefs } from './project'
import { PluginsPane } from '../plugin'
import * as act from '../../actions'

import {
  getAllTemplatesByType,
  getPropertyList,
  getVocabs
} from '../../selectors'

class Prefs extends React.PureComponent {
  isActive(pane) {
    return this.props.pane === pane
  }

  toggle = (pane) => {
    this.props.onPrefsUpdate({ pane })
  }

  render() {
    return (
      <div
        className="prefs"
        onContextMenu={this.props.onContextMenu}>
        <header className="prefs-header">
          <Titlebar isOptional>
            <FormattedMessage id="prefs.title"/>
          </Titlebar>
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
                  isDisabled={!this.props.project.id}
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
              properties={this.props.properties}
              templates={this.props.templates}
              settings={this.props.settings}
              onSettingsUpdate={this.props.onSettingsUpdate}/>
          </PrefPane>
          <PrefPane
            name="project"
            isActive={this.isActive('project')}>
            <ProjectPrefs
              project={this.props.project}
              onChange={() => {}}/>
          </PrefPane>

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
            properties={this.props.properties}
            templates={this.props.templates}
            onUninstall={this.props.onPluginUninstall}
            onOpenLink={this.props.onOpenLink}
            isActive={this.isActive('plugins')}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    edit: object.isRequired,
    templates: object.isRequired,
    pane: string.isRequired,
    project: object,
    properties: array.isRequired,
    settings: object.isRequired,
    vocab: array.isRequired,
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
}

export const PrefsContainer = connect(
  state => ({
    edit: state.edit,
    templates: getAllTemplatesByType(state),
    keymap: state.keymap,
    pane: state.prefs.pane,
    project: state.project,
    properties: getPropertyList(state),
    settings: state.settings,
    vocab: getVocabs(state)
  }),

  dispatch => ({
    onClassSave(...args) {
      dispatch(act.ontology.class.save(...args))
    },

    onContextMenu(event) {
      event.stopPropagation()
      dispatch(act.context.show(event))
    },

    onOpenLink(...args) {
      dispatch(act.shell.openLink(args))
    },

    onPrefsUpdate(...args) {
      dispatch(act.prefs.update(...args))
    },

    onPropsSave(...args) {
      dispatch(act.ontology.props.save(...args))
    },

    onSettingsUpdate(...args) {
      dispatch(act.settings.update(...args))
    },

    onVocabDelete(...args) {
      dispatch(act.ontology.vocab.delete(...args))
    },

    onVocabExport(...args) {
      dispatch(act.ontology.vocab.export(...args))
    },

    onVocabSave(...args) {
      dispatch(act.ontology.vocab.save(...args))
    },

    onOntologyImport() {
      dispatch(act.ontology.import())
    },

    onPluginUninstall(...args) {
      dispatch(act.plugin.uninstall(...args))
    }
  })
)(Prefs)
