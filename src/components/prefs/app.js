import React, { } from 'react'
import { ipcRenderer as ipc } from 'electron'
import ARGS from '../../args.js'
import { ExportSettings } from './export.js'
import { PrintSettings } from './print.js'
import { InterfaceSettings } from './interface.js'
import { StyleSettings } from './style.js'
import { TemplateSelect } from '../template/select.js'
import { ResourceSelect } from '../resource/select.js'
import { ScrollContainer } from '../scroll/container.js'

import {
  IMAGE
} from '../../constants/index.js'

import {
  IconItemSmall,
  IconPhoto,
  IconSelection
} from '../icons.js'

import {
  array, arrayOf, bool, func, object, shape, string, number
} from 'prop-types'

import {
  Form,
  FormElement,
  FormField,
  FormSelect,
  FormToggle,
  FormToggleGroup
} from '../form.js'


export class AppPrefs extends React.PureComponent {
  handleDebugChange() {
    ipc.send('cmd', 'app:toggle-debug-flag')
  }

  handleLocaleChange = ({ locale }) => {
    ipc.send('cmd', 'app:switch-locale', locale)
  }

  handleLocalTimeChange = ({ localtime }) => {
    this.props.onSettingsUpdate({ localtime })
  }

  handleTemplateChange = (values, hasChanged) => {
    if (hasChanged) {
      let [type, template] = Object.entries(values)[0]
      this.props.onSettingsUpdate({
        templates: {
          [type]: template.id
        }
      })
    }
  }

  handleTitleChange = (values, hasChanged) => {
    if (hasChanged) {
      let [name, value] = Object.entries(values)[0]
      if (value && value.id) value = value.id
      this.props.onSettingsUpdate({
        title: {
          [name]: value
        }
      })
    }
  }

  render() {
    return (
      <ScrollContainer>
        <Form>
          <FormElement id="prefs.app.templates.label">
            <TemplateSelect
              icon={<IconItemSmall/>}
              id="prefs.app.templates.label"
              isRequired
              name="item"
              options={this.props.templates.item}
              value={this.props.settings.templates.item}
              tabIndex={0}
              onChange={this.handleTemplateChange}/>
            <TemplateSelect
              icon={<IconPhoto/>}
              isRequired
              name="photo"
              options={this.props.templates.photo}
              value={this.props.settings.templates.photo}
              tabIndex={0}
              onChange={this.handleTemplateChange}/>
            <TemplateSelect
              icon={<IconSelection/>}
              isRequired
              name="selection"
              options={this.props.templates.selection}
              value={this.props.settings.templates.selection}
              tabIndex={0}
              onChange={this.handleTemplateChange}/>
          </FormElement>
          <hr/>
          <FormToggleGroup
            id="prefs.app.dup"
            name="dup"
            isCompact
            value={this.props.settings.dup}
            options={this.props.dupOptions}
            onChange={this.props.onSettingsUpdate}/>
          <FormToggle
            id="prefs.app.localtime"
            name="localtime"
            value={this.props.settings.localtime}
            onChange={this.handleLocalTimeChange}/>
          <FormElement
            id="prefs.app.title.label"
            isCompact>
            <ResourceSelect
              icon={<IconItemSmall/>}
              id="prefs.app.title.label"
              options={this.props.properties}
              name="item"
              value={this.props.settings.title.item}
              tabIndex={0}
              onChange={this.handleTitleChange}/>
            <ResourceSelect
              icon={<IconPhoto/>}
              options={this.props.properties}
              name="photo"
              value={this.props.settings.title.photo}
              tabIndex={0}
              onChange={this.handleTitleChange}/>
          </FormElement>
          <FormToggle
            id="prefs.app.title.force"
            name="force"
            value={this.props.settings.title.force}
            onChange={this.handleTitleChange}/>
          <FormField
            id="prefs.app.density.label"
            isCompact
            isRequired
            max={this.props.importMax}
            min={this.props.importMin}
            name="density"
            onChange={this.props.onSettingsUpdate}
            title="prefs.app.density.title"
            tabIndex={0}
            type="number"
            value={this.props.settings.density}/>
          <hr/>
          <StyleSettings/>
          <hr/>
          <FormSelect
            id="prefs.app.locale.locale"
            name="locale"
            isRequired
            isSelectionHidden
            value={this.props.settings.locale}
            options={this.props.locales}
            tabIndex={0}
            onChange={this.handleLocaleChange}/>
          <hr/>
          <InterfaceSettings
            config={this.props.settings}
            onChange={this.props.onSettingsUpdate}/>
          <hr/>
          <ExportSettings
            config={this.props.settings.export}
            onChange={this.props.onSettingsUpdate}/>
          <hr/>
          <PrintSettings
            config={this.props.settings.print}
            onChange={this.props.onSettingsUpdate}/>
          <hr/>
          <FormToggle
            id="prefs.app.debug"
            name="debug"
            isDisabled={ARGS.dev}
            value={this.props.settings.debug || ARGS.dev}
            onChange={this.handleDebugChange}/>
        </Form>
      </ScrollContainer>
    )
  }

  static propTypes = {
    properties: array.isRequired,
    templates: shape({
      item: array.isRequired,
      photo: array.isRequired,
      selection: array.isRequired
    }).isRequired,
    settings: shape({
      debug: bool.isRequired,
      layout: string.isRequired,
      locale: string.isRequired,
      templates: object.isRequired
    }).isRequired,
    locales: arrayOf(string).isRequired,
    importMin: number.isRequired,
    importMax: number.isRequired,
    dupOptions: arrayOf(string).isRequired,
    onSettingsUpdate: func.isRequired
  }

  static defaultProps = {
    locales: ['cn', 'de', 'en', 'es', 'fr', 'it', 'ja', 'pt', 'pt-BR', 'uk'],
    dupOptions: ['skip', 'import', 'prompt'],
    importMin: IMAGE.MIN_DENSITY,
    importMax: IMAGE.MAX_DENSITY
  }
}
