import React from 'react'
import { Form } from '../form.js'
import { DeveloperSettings } from './dev.js'
import { ExportSettings } from './export.js'
import { PrintSettings } from './print.js'
import { InterfaceSettings } from './interface.js'
import { ImportSettings } from './import.js'
import { LocaleSettings } from './locale.js'
import { StyleSettings } from './style.js'
import { TemplateSettings } from './template.js'
import { ScrollContainer } from '../scroll/container.js'
import { func, object, shape, string } from 'prop-types'


export class AppPrefs extends React.PureComponent {
  render() {
    return (
      <ScrollContainer>
        <Form>
          <TemplateSettings
            config={this.props.settings.templates}
            onChange={this.props.onSettingsUpdate}/>
          <hr/>
          <ImportSettings
            config={this.props.settings}
            onChange={this.props.onSettingsUpdate}/>
          <hr/>
          <StyleSettings/>
          <hr/>
          <LocaleSettings/>
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
          <DeveloperSettings/>
        </Form>
      </ScrollContainer>
    )
  }

  static propTypes = {
    settings: shape({
      layout: string.isRequired,
      templates: object.isRequired
    }).isRequired,
    onSettingsUpdate: func.isRequired
  }
}
