'use strict'

const assert = require('assert')
const { ipcRenderer: ipc } = require('electron')
const { counter, get } = require('./common/util')
const { warn } = require('./common/log')
const { basename } = require('path')

let seq
let pending
let STORE

function t(id, prefix = '') {
  return get(STORE.getState(), ['intl', 'messages', `${prefix}${id}`], id)
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
    const id = seq.next().value
    ipc.send('dialog', { id, type, options })
    pending[id] = { resolve, reject }
  })
}

function notify(options) {
  return show('message-box', {
    type: 'none', buttons: ['OK'], ...options
  })
}

function fail(error, message = 'Error') {
  return notify({
    type: 'error',
    title: 'Error',
    message: t(message, 'error.'),
    detail: (message === error.message) ? null : error.message
  })
}

async function prompt(message, {
  buttons = ['cancel', 'ok'],
  defaultId = 0,
  cancelId = 0,
  checkbox,
  isChecked,
  detail,
  prefix = '',
  ...options
} = {}) {
  const { response, checked } = await show('message-box', {
    type: 'question',
    buttons: buttons.map(id => t(id, prefix)),
    message: t(message, prefix),
    defaultId,
    cancelId,
    checkboxLabel: (checkbox != null) ? t(checkbox, prefix) : undefined,
    checkboxChecked: isChecked,
    detail: t(detail, prefix),
    ...options
  })

  const ok = response !== cancelId

  return {
    ok, cancel: !ok, isChecked: checked
  }
}

function save(options) {
  return show('save', options)
}

function open(options) {
  return show('file', options)
}

prompt.dup = (file, options) =>
  prompt(basename(file), {
    checkbox: 'checkbox',
    isChecked: false,
    detail: 'message',
    prefix: 'dialog.prompt.dup.',
    ...options
  })

prompt.plugin = {
  uninstall: (label, options) =>
    prompt(label, {
      detail: 'message',
      prefix: 'dialog.prompt.plugin.uninstall.',
      type: 'warning',
      ...options
    })
}

open.images = (options) => open({
  filters: [{
    name: t('dialog.filter.images'),
    extensions: ['jpg', 'jpeg', 'png', 'svg']
  }],
  defaultPath: ARGS.pictures,
  properties: ['openFile', 'multiSelections'],
  ...options
})

open.vocab = (options) => open({
  filters: [{
    name: t('dialog.filter.rdf'),
    extensions: ['n3', 'ttl']
  }],
  defaultPath: ARGS.documents,
  properties: ['openFile', 'multiSelections'],
  ...options
})

open.templates = (options) => open({
  filters: [{
    name: t('dialog.filter.templates'),
    extensions: ['ttp']
  }],
  defaultPath: ARGS.documents,
  properties: ['openFile', 'multiSelections'],
  ...options
})


save.project = (options) => save({
  filters: [{
    name: t('dialog.filter.projects'),
    extensions: ['tpy']
  }],
  defaultPath: ARGS.documents,
  properties: ['createDirectory'],
  ...options
})


save.template = (options) => save({
  filters: [{
    name: t('dialog.filter.templates'),
    extensions: ['ttp']
  }],
  properties: ['createDirectory'],
  ...options
})

save.items = (options) => save({
  filters: [{
    name: t('dialog.filter.jsonld'),
    extensions: ['json', 'jsonld']
  }],
  properties: ['createDirectory'],
  ...options
})

save.vocab = (options) => save({
  filters: [{
    name: t('dialog.filter.rdf'),
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
