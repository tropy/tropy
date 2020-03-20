'use strict'

const assert = require('assert')
const { ipcRenderer: ipc, shell, clipboard } = require('electron')
const { blank, counter, get } = require('./common/util')
const { crashReport, warn } = require('./common/log')
const { IMAGE } = require('./constants')

let seq
let pending
let STORE

function t(...args) {
  return get(STORE.getState(), ['intl', 'messages', ...args])
}

function start(store) {
  assert(seq == null, 'already initialized')

  seq = counter()
  pending = {}
  STORE = store

  ipc.on('dialog', onClosed)
}

function stop() {
  ipc.removeListener('dialog', onClosed)
  seq = null
  pending = null
}

function onClosed(_, { id, payload, error }) {
  try {
    pending[id][error ? 'reject' : 'resolve'](payload)
  } catch (error) {
    warn(`failed to resolve dialog #${id}: ${error.message}`)
  } finally {
    delete pending[id]
  }
}

function show(type, options = {}) {
  return new Promise((resolve, reject) => {
    let id = seq.next().value
    ipc.send('wm', 'dialog', { id, type, options })
    pending[id] = { resolve, reject }
  })
}

function notify(opts) {
  return show('message-box', {
    type: 'none',
    ...t('dialog', 'notify'),
    ...opts
  })
}

function fail(e, msg) {
  return notify({
    type: 'error',
    ...t('dialog', 'error'),
    message: t(`error.${msg}`) || e.message,
    detail: e.stack
  }).then(({ response }) => {
    switch (response) {
      case 1:
        clipboard.write({ text: crashReport(e, msg) })
        break
      case 2:
        shell.openItem(ARGS.log)
        break
    }
  })
}

async function prompt(id, {
  defaultId = 0,
  cancelId = 0,
  isChecked = false,
  ...opts
} = {}) {
  let { response, checked } = await show('message-box', {
    type: 'question',
    ...t('dialog', 'prompt', ...id.split('.')),
    defaultId,
    cancelId,
    checkboxChecked: isChecked,
    ...opts
  })

  return {
    ok: response !== cancelId,
    cancel: response === cancelId,
    isChecked: checked
  }
}

function save(opts) {
  return show('save', opts)
}

function open(opts) {
  return show('file', opts)
}

open.images = (opts) => open({
  filters: [{
    name: t('dialog', 'filter', 'images'),
    extensions: IMAGE.EXT
  }],
  properties: ['openFile', 'multiSelections'],
  ...opts
})

open.items = (opts) => open({
  filters: [{
    name: t('dialog', 'filter', 'items'),
    extensions: [...IMAGE.EXT, 'json', 'jsonld']
  }],
  properties: ['openFile', 'multiSelections'],
  ...opts
})

open.image = (opts) => open.images({
  properties: ['openFile'],
  ...opts
})

open.dir = (opts) => open({
  properties: ['openDirectory', 'multiSelections'],
  ...opts
})

open.vocab = (opts) => open({
  filters: [{
    name: t('dialog', 'filter', 'rdf'),
    extensions: ['n3', 'ttl']
  }],
  properties: ['openFile', 'multiSelections'],
  ...opts
})

open.templates = (options) => open({
  filters: [{
    name: t('dialog', 'filter', 'templates'),
    extensions: ['ttp']
  }],
  properties: ['openFile', 'multiSelections'],
  ...options
})


save.project = (options) => save({
  filters: [{
    name: t('dialog', 'filter', 'projects'),
    extensions: ['tpy']
  }],
  properties: ['createDirectory'],
  ...options
})


save.csv = (options) => save({
  filters: [{
    name: t('dialog', 'filter', 'csv'),
    extensions: ['csv']
  }],
  properties: ['createDirectory'],
  ...options
})

save.template = (options) => save({
  filters: [{
    name: t('dialog', 'filter', 'templates'),
    extensions: ['ttp']
  }],
  properties: ['createDirectory'],
  ...options
})

save.items = (options) => save({
  filters: [{
    name: t('dialog', 'filter', 'jsonld'),
    extensions: ['json', 'jsonld']
  }],
  properties: ['createDirectory'],
  ...options
})

save.vocab = (options) => save({
  filters: [{
    name: t('dialog', 'filter', 'rdf'),
    extensions: ['n3']
  }],
  properties: ['createDirectory'],
  ...options
})


module.exports = {
  fail,
  notify,
  open,
  prompt,
  save,
  show,
  start,
  stop
}
