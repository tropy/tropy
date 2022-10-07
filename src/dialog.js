import assert from 'node:assert'
import { extname, dirname } from 'node:path'
import { ipcRenderer as ipc, shell, clipboard } from 'electron'
import ARGS from './args.js'
import { counter, get } from './common/util.js'
import { crashReport, warn } from './common/log.js'
import { pext } from './common/project.js'
import IMAGE from './constants/image.js'
import { darwin } from './common/os.js'

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

function fail(e, code = e.code, detail) {
  let message = t(`error.${code}`) || e.message

  return notify({
    type: 'error',
    ...t('dialog', 'error'),
    message,
    detail: detail || e.stack
  }).then(({ response }) => {
    switch (response) {
      case 1:
        clipboard.write({ text: crashReport(e, message) })
        break
      case 2:
        shell.openPath(ARGS.log)
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
  filters: [
    {
      name: t('dialog', 'filter', 'images'),
      extensions: IMAGE.EXT
    },
    {
      name: t('dialog', 'filter', 'items'),
      extensions: ['json', 'jsonld']
    }
  ],
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

open.project = (path) => {
  let defaultPath
  let extensions = ['tpy', 'tropy', 'mtpy']
  let properties = ['openFile']

  if (path) {
    extensions = [extname(path)]
    defaultPath = dirname(path)

    if (extensions[0] !== 'tpy' && !darwin)
      properties = ['openDirectory']
  }


  return open({
    filters: [
      {
        name: t('dialog', 'filter', 'projects'),
        extensions
      }
    ],
    defaultPath,
    properties
  })
}

open.vocab = (opts) => open({
  filters: [{
    name: t('dialog', 'filter', 'rdf'),
    extensions: ['n3', 'ttl']
  }],
  properties: ['openFile', 'multiSelections'],
  ...opts
})

open.templates = (opts) => open({
  filters: [{
    name: t('dialog', 'filter', 'templates'),
    extensions: ['ttp']
  }],
  properties: ['openFile', 'multiSelections'],
  ...opts
})


save.project = (type, name = 'Project', opts = {}) => save({
  filters: [{
    name: t('dialog', 'filter', 'projects'),
    extensions: [pext(type)]
  }],
  properties: [
    'createDirectory',
    'showOverwriteConfirmation'
  ],
  defaultPath: `${name}.${pext(type)}`,
  ...opts
})

save.tpm = (opts) => save({
  filters: [{
    name: t('dialog', 'filter', 'projects'),
    extensions: ['tpm']
  }],
  properties: [
    'createDirectory',
    'showOverwriteConfirmation'
  ],
  ...opts
})

save.csv = (opts) => save({
  filters: [{
    name: t('dialog', 'filter', 'csv'),
    extensions: ['csv']
  }],
  ...opts
})

save.template = (opts) => save({
  filters: [{
    name: t('dialog', 'filter', 'templates'),
    extensions: ['ttp']
  }],
  ...opts
})

save.items = (opts) => save({
  filters: [{
    name: t('dialog', 'filter', 'jsonld'),
    extensions: ['json', 'jsonld']
  }],
  ...opts
})

save.image = (opts) => save({
  filters: [{
    name: t('dialog', 'filter', 'images'),
    extensions: ['jpg', 'jpeg', 'png', 'webp']
  }],
  ...opts
})

save.vocab = (opts) => save({
  filters: [{
    name: t('dialog', 'filter', 'rdf'),
    extensions: ['n3']
  }],
  ...opts
})

save.notes = (opts) => save({
  filters: [{
    name: t('dialog', 'filter', 'notes'),
    extensions: ['json', 'jsonld', 'md', 'markdown', 'html', 'txt']
  }],
  ...opts
})


export {
  fail,
  notify,
  open,
  prompt,
  save,
  show,
  start,
  stop
}
