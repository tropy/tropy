import React from 'react'
import { createRoot } from 'react-dom/client'
import ARGS from '../args.js'
import { create } from '../stores/prefs.js'
import { Main } from '../components/main.js'
import { PrefsContainer } from '../components/prefs/container.js'
import { main } from '../sagas/prefs.js'
import win from '../window.js'
import { intl, prefs, project, history, settings } from '../actions/index.js'
import * as dialog from '../dialog.js'

export const store = create()
export const tasks = store.saga.run(main)

const { locale, file } = ARGS

Promise.all([
  store.dispatch(intl.load({ locale }))
])
  .then(() => {
    if (file != null) {
      store.dispatch(project.open(file))
    }

    createRoot(document.getElementById('main'))
      .render(
        <Main store={store} window={win}>
          <PrefsContainer/>
        </Main>
      )
  })

dialog.start(store)

win.on('app.undo', () => {
  store.dispatch(history.undo())
})
win.on('app.redo', () => {
  store.dispatch(history.redo())
})
win.on('settings.update', (opts) => {
  store.dispatch(settings.update(opts))
  if (opts.locale) {
    store.dispatch(intl.load({ locale: opts.locale }))
  }
})

win.unloaders.push(() => (
  store.dispatch(prefs.close()),
  tasks.toPromise().finally(() => dialog.stop())
))
