'use strict'

const React = require('react')
const { render } = require('react-dom')
const { all } = require('bluebird')
const { ready, $ } = require('../dom')
const { create } = require('../stores/prefs')
const { Main } = require('../components/main')
const { PrefsContainer } = require('../components/prefs')
const { main } = require('../sagas/prefs')
const { win } = require('../window')
const act = require('../actions')
const dialog = require('../dialog')

const store = create()
const tasks = store.saga.run(main)

const { locale } = ARGS

all([
  store.dispatch(act.intl.load({ locale })),
  store.dispatch(act.keymap.load({ name: 'project', locale })),
  ready
])
  .then(() => {
    render(<Main store={store}><PrefsContainer/></Main>, $('.view'))
  })

dialog.start(store)

win.on('style.update', () => {
  store.dispatch(act.settings.update({ theme: win.state.theme }))
})

win.unloaders.push(dialog.stop)
win.unloaders.push(() => (
  store.dispatch(act.prefs.close()), tasks.done
))


if (ARGS.dev || ARGS.debug) {
  Object.defineProperty(window, 'store', { get: () => store })
  Object.defineProperty(window, 'state', { get: () => store.getState() })
}
