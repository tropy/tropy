import React from 'react'
import { createRoot } from 'react-dom/client'
import ARGS from '../args'
import { Main } from '../components/main'
import { ProjectContainer } from '../components/project/container'
import { create } from '../stores/project'
import { main } from '../sagas/project'
import win from '../window'
import { idle, intl, project, history, keymap, settings } from '../actions'
import * as dialog from '../dialog'

export const store = create()
export const tasks = store.saga.run(main)

const { locale, file } = ARGS

Promise.all([
  store.dispatch(intl.load({ locale })),
  store.dispatch(keymap.load({ locale }))
])
  .then(() => {
    if (file != null) {
      store.dispatch(project.open(file))
    }

    createRoot(document.getElementById('main'))
      .render(
        <Main store={store} window={win}>
          <ProjectContainer
            isWindowResizeAnimated={win.isResizeAnimated}/>
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
win.on('idle', ({ type, time }) => {
  store.dispatch(idle[type](time))
})

win.unloaders.push(dialog.stop)
win.unloaders.push(() => (
  store.dispatch(project.close()), tasks.toPromise()
))
