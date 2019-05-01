'use strict'

const { debug } = require('../common/log')
debug('prefs window 1')

const React = require('react')
debug('prefs window 2')
const { render } = require('react-dom')
debug('prefs window 3')
const { $ } = require('../dom')
debug('prefs window 4')
const { create } = require('../stores/prefs')
debug('prefs window 5')
const { Main } = require('../components/main')
debug('prefs window 6')
const { PrefsContainer } = require('../components/prefs')
debug('prefs window 7')
const { main } = require('../sagas/prefs')
debug('prefs window 8')
const { win } = require('../window')
debug('prefs window 9')
const act = require('../actions')
debug('prefs window 10')
const dialog = require('../dialog')
debug('prefs window 11')

const store = create()
const tasks = store.saga.run(main)

const { locale } = ARGS

Promise.all([
  store.dispatch(act.intl.load({ locale })),
  store.dispatch(act.keymap.load({ name: 'project', locale }))
])
  .then(() => {
    render(<Main store={store}><PrefsContainer/></Main>, $('main'))
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

win.unloaders.push(dialog.stop)
win.unloaders.push(() => (
  store.dispatch(act.prefs.close()), tasks.toPromise()
))

if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
