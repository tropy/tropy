'use strict'

const assert = require('assert')
const { ipcRenderer: ipc } = require('electron')
const { counter, get } = require('./common/util')
const { warn } = require('./common/log')

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

function open(type, options = {}) {
  return new Promise((resolve, reject) => {
    const id = seq.next().value

    ipc.send('dialog', { id, type, options })
    pending[id] = { resolve, reject }
  })
}

function notify(options) {
  return open('message-box', {
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
  ...options
} = {}, prefix = 'dialog.prompt.') {
  const { response, checked } = await open('message-box', {
    type: 'question',
    buttons: buttons.map(id => t(id, prefix)),
    message: t(message, prefix),
    defaultId,
    cancelId,
    checkboxLabel: (checkbox != null) ? t(checkbox, prefix) : undefined,
    checkboxChecked: isChecked,
    ...options
  })

  const ok = response !== cancelId

  return {
    ok, cancel: !ok, isChecked: checked
  }
}

function save(options) {
  return open('save', options)
}

function file(options) {
  return open('file', options)
}

function openImages(options) {
  return open('file', {
    filters: [
      { name: t('dialog.filter.images'), extensions: ['jpg', 'jpeg'] }
    ],
    properties: ['openFile', 'multiSelections'],
    ...options
  })
}

function openVocabs(options) {
  return open('file', {
    filters: [
      { name: t('dialog.filter.rdf'), extensions: ['n3', 'ttl'] }
    ],
    properties: ['openFile', 'multiSelections'],
    ...options
  })
}

function openTemplates(options) {
  return open('file', {
    filters: [
      { name: t('dialog.filter.templates'), extensions: ['ttp'] }
    ],
    properties: ['openFile', 'multiSelections'],
    ...options
  })
}

function saveProject(options) {
  return open('save', {
    filters: [
      { name: t('dialog.filter.projects'), extensions: ['tpy'] }
    ],
    ...options
  })
}

function exportTemplate(options) {
  return open('save', {
    filters: [
      { name: t('dialog.filter.templates'), extensions: ['ttp'] }
    ],
    ...options
  })
}

module.exports = {
  start,
  stop,
  open,
  notify,
  exportTemplate,
  fail,
  file,
  openImages,
  openTemplates,
  openVocabs,
  save,
  saveProject,
  prompt
}
