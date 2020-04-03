'use strict'

const React = require('react')
const { render } = require('react-dom')
const { Main } = require('../components/main')
const { ProjectContainer } = require('../components/project/container')
const { create } = require('../stores/project')
const { main } = require('../sagas/project')
const { win } = require('../window')
const act = require('../actions')
const dialog = require('../dialog')

const store = create()
const tasks = store.saga.run(main)

const { locale, file } = ARGS

Promise.all([
  store.dispatch(act.intl.load({ locale })),
  store.dispatch(act.keymap.load({ name: 'project', locale }))
])
  .then(() => {
    if (file != null) {
      store.dispatch(act.project.open(file))
    }

    render(
      <Main store={store} window={win}>
        <ProjectContainer/>
      </Main>,
      document.getElementById('main')
    )
  })

dialog.start(store)

win.on('app.undo', () => {
  store.dispatch(act.history.undo())
})
win.on('app.redo', () => {
  store.dispatch(act.history.redo())
})
win.on('settings.update', (settings) => {
  store.dispatch(act.settings.update(settings))
  if (settings.locale) {
    store.dispatch(act.intl.load({ locale: settings.locale }))
  }
})
win.on('idle', ({ type, time }) => {
  store.dispatch(act.idle[type](time))
})

win.unloaders.push(dialog.stop)
win.unloaders.push(() => (
  store.dispatch(act.project.close()), tasks.toPromise()
))

Object.defineProperty(window, 'store', { get: () => store })
Object.defineProperty(window, 'state', { get: () => store.getState() })

{
  // Apply PIXI unsafe-eval patch
  const PIXI = require('@pixi/core')
  const { install } = require('@pixi/unsafe-eval')
  install(PIXI)
}
