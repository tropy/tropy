import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
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
import act from '../../actions/settings.js'


export function AppPrefs() {
  let dispatch = useDispatch()
  let settings = useSelector(state => state.settings)

  let handleSettingsUpdate = useEvent((...args) => {
    dispatch(act.update(...args))
  })

  return (
    <ScrollContainer>
      <Form>
        <TemplateSettings
          config={settings.templates}
          onChange={handleSettingsUpdate}/>
        <hr/>
        <ImportSettings
          config={settings}
          onChange={handleSettingsUpdate}/>
        <hr/>
        <StyleSettings/>
        <hr/>
        <LocaleSettings/>
        <hr/>
        <InterfaceSettings
          config={settings}
          onChange={handleSettingsUpdate}/>
        <hr/>
        <ExportSettings
          config={settings.export}
          onChange={handleSettingsUpdate}/>
        <hr/>
        <PrintSettings
          config={settings.print}
          onChange={handleSettingsUpdate}/>
        <hr/>
        <DeveloperSettings/>
      </Form>
    </ScrollContainer>
  )
}
