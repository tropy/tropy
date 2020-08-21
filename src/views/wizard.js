import React from 'react'
import { render } from 'react-dom'
import { create } from '../stores/wizard'
import { Main } from '../components/main'
import { WizardContainer } from '../components/wizard'
import { win } from '../window'
import { intl, history, settings } from '../actions'
import * as dialog from '../dialog'

export const store = create()
const { locale } = ARGS

store
  .dispatch(intl.load({ locale }))
  .then(() => {
    render(
      <Main store={store} window={win}>
        <WizardContainer/>
      </Main>,
      document.getElementById('main'))
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

if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
