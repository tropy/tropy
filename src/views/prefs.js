import React from 'react'
import { createRoot } from 'react-dom/client'
import ARGS from '../args'
import { create } from '../stores/prefs'
import { Main } from '../components/main'
import { PrefsContainer } from '../components/prefs'
import { main } from '../sagas/prefs'
import win from '../window'
import { intl, prefs, project, history, settings } from '../actions'
import * as dialog from '../dialog'

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

win.unloaders.push(dialog.stop)
win.unloaders.push(() => (
  store.dispatch(prefs.close()), tasks.toPromise()
))
