import React from 'react'
import { createRoot } from 'react-dom/client'
import ARGS from '../args'
import { create } from '../stores/wizard'
import { Main } from '../components/main'
import { WizardContainer } from '../components/wizard'
import win from '../window'
import { intl, history, settings } from '../actions'
import * as dialog from '../dialog'

export const store = create()
const { locale } = ARGS

store
  .dispatch(intl.load({ locale }))
  .then(() => {
    createRoot(document.getElementById('main'))
      .render(
        <Main store={store} window={win}>
          <WizardContainer/>
        </Main>
      )
  })

dialog.start(store)
win.unloaders.push(dialog.stop)

win.on('app.undo', () => {
  store.dispatch(history.undo())
})
win.on('app.redo', () => {
  store.dispatch(history.redo())
})
win.on('settings.update', (data) => {
  store.dispatch(settings.update(data))
})
