import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Prefs, Body, Header } from './index.js'
import { Nav, NavItem } from './nav.js'
import { TemplateEditor } from '../template/editor.js'
import { VocabBrowser } from '../vocab/browser.js'
import { Pane, Footer } from './pane.js'
import { AppSettings } from '../settings/app.js'
import { ProjectSettings } from '../project/settings.js'
import { PluginConfig } from '../plugin/config.js'
import { useIpcEvent } from '../../hooks/use-ipc.js'
import * as act from '../../actions/index.js'
import { Button } from '../button.js'
import { IconPlus } from '../icons.js'


export function PrefsContainer() {
  let dispatch = useDispatch

  let project = useSelector(state => state.project)
  let handleProjectChange = useCallback((...args) => {
    dispatch(act.project.save(...args))
  }, [dispatch])

  let handleVocabImport = useCallback(() => {
    dispatch(act.ontology.import())
  }, [dispatch])

  let handlePluginInstall = useIpcEvent(null, [
    'cmd', 'app:install-plugin'
  ])


  let handlePluginUninstall = useCallback((...args) => {
    dispatch(act.plugin.uninstall(...args))
  }, [dispatch])

  let handleContextMenu = useCallback((event) => {
    event.stopPropagation()
    dispatch(act.context.show(event))
  }, [dispatch])

  let openLink = useCallback((...args) => {
    dispatch(act.shell.openLink(...args))
  }, [dispatch])

  return (
    <Prefs onContextMenu={handleContextMenu}>
      <Header>
        <Nav>
          <NavItem name="app" icon="IconTropy"/>
          <NavItem
            name="project"
            icon="IconMazePrefs"
            isDisabled={!project?.id}/>
          <NavItem name="template" icon="IconTemplate"/>
          <NavItem name="vocab" icon="IconBook"/>
          <NavItem name="plugins" icon="IconPlugin"/>
        </Nav>
      </Header>
      <Body>
        <Pane name="app">
          <AppSettings/>
        </Pane>

        <Pane name="project" isDisabled={!project?.id}>
          <ProjectSettings
            project={project}
            onChange={handleProjectChange}/>
        </Pane>

        <Pane name="templates">
          <TemplateEditor/>
        </Pane>

        <Pane name="vocab">
          <VocabBrowser
            onOpenLink={openLink}/>
          <Footer>
            <Button
              icon={<IconPlus/>}
              onClick={handleVocabImport}/>
          </Footer>
        </Pane>

        <Pane name="plugins">
          <PluginConfig
            onOpenLink={openLink}
            onUninstall={handlePluginUninstall}/>
          <Footer>
            <Button
              isDefault
              text="prefs.plugins.install"
              onClick={handlePluginInstall}/>
          </Footer>
        </Pane>
      </Body>
    </Prefs>
  )
}
