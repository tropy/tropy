import React from 'react'
import { render } from 'react-dom'
import { create } from '../stores/prefs'
import { Main } from '../components/main'
import { PrefsContainer } from '../components/prefs'
import { main } from '../sagas/prefs'
import { win } from '../window'
import { intl, prefs, history, keymap, settings } from '../actions'
import * as dialog from '../dialog'

export const store = create()
export const tasks = store.saga.run(main)

const { locale } = ARGS

Promise.all([
  store.dispatch(intl.load({ locale })),
  store.dispatch(keymap.load({ name: 'project', locale }))
])
  .then(() => {
    render(
      <Main store={store} window={win}>
        <PrefsContainer/>
      </Main>,
      document.getElementById('main'))
  })

dialog.start(store)

win.on('app.undo', () => {
  store.dispatch(history.undo())
})
win.on('app.redo', () => {
  store.dispatch(history.redo())
})
win.on('settings.update', (settings) => {
  store.dispatch(settings.update(settings))
  if (settings.locale) {
    store.dispatch(intl.load({ locale: settings.locale }))
  }
})

win.unloaders.push(dialog.stop)
win.unloaders.push(() => (
  store.dispatch(prefs.close()), tasks.toPromise()
))

if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
