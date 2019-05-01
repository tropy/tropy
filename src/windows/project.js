'use strict'

const { debug } = require('../common/log')
const React = require('react')
const { render } = require('react-dom')
const { $ } = require('../dom')
const { create } = require('../stores/project')
debug('P1')
const { Main } = require('../components/main')
debug('P2')
const { ProjectContainer } = require('../components/project')
debug('P3')
const { main } = require('../sagas/project')
debug('P4')
const { win } = require('../window')
debug('P5')
const act = require('../actions')
debug('P6')
const dialog = require('../dialog')
debug('P7')

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
      <Main store={store}><ProjectContainer/></Main>,
      $('main')
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
