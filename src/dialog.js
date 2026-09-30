import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { extname, dirname } from 'node:path'
import { ipcRenderer as ipc } from 'electron'
import { IntlMessageFormat } from 'intl-messageformat'
import ARGS from './args.js'
import { counter, get } from './common/util.js'
import { copy } from './clipboard.js'
import { crashReport, warn } from './common/log.js'
import { pext } from './common/project.js'
import IMAGE from './constants/image.js'
import { darwin } from './common/os.js'

let instance
export { instance as default }

export function createDialogService (store) {
  assert(instance == null, 'dialog service already initialized')
  instance = new DialogService(store)
  instance.start()
  return instance
}

export class DialogService extends EventEmitter {
  #seq = counter()
  #pending = new Map()
  #isLayerAttached = false

  modals = Object.create(null)

  constructor (store) {
    super()
    this.store = store
  }

  #handleIpcMessage = (_, { id, payload, error }) => {
    this.#settle(id, error ? 'reject' : 'resolve', payload)
  }

  #settle (id, method, payload) {
    let dialog = this.#pending.get(id)

    if (!dialog) {
      warn(`failed to settle dialog #${id}: not pending`)
      return
    }

    this.#pending.delete(id)

    if (dialog.isModal)
      this.emit('change')

    dialog[method](payload)
  }

  register (type, component) {
    this.modals[type] = component

    return () => {
      if (this.modals[type] !== component)
        return

      delete this.modals[type]

      this.#pending.values().forEach(dialog => {
        if (dialog.isModal && dialog.type === type)
          this.close(dialog.id)
      })
    }
  }

  attach () {
    this.#isLayerAttached = true

    return () => {
      this.#isLayerAttached = false

      this.#pending.values().forEach(dialog => {
        if (dialog.isModal) this.close(dialog.id)
      })
    }
  }

  start () {
    ipc.on('dialog', this.#handleIpcMessage)
  }

  stop = () => {
    ipc.removeListener('dialog', this.#handleIpcMessage)
    this.clear()
  }

  close (id, result) {
    this.#settle(id, 'resolve', result)
  }

  clear () {
    this.#pending.values().forEach(dialog => {
      this.close(dialog.id)
    })
  }

  get current () {
    return this.#pending.values().find(dialog => dialog.isModal)
  }

  canShowAsModal (type) {
    return this.#isLayerAttached && (type in this.modals)
  }

  localize (...args) {
    return get(this.store.getState(), ['intl', 'messages', ...args])
  }

  show (type, { signal, ...options } = {}) {
    if (signal?.aborted)
      return Promise.resolve()

    let { promise, resolve, reject } = Promise.withResolvers()
    let { value: id } = this.#seq.next()
    let isModal = this.canShowAsModal(type)

    this.#pending.set(id, { id, type, options, isModal, resolve, reject })

    if (signal) {
      let close = () => { this.close(id) }
      let cleanup = () => { signal.removeEventListener('abort', close) }

      signal.addEventListener('abort', close, { once: true })
      promise.then(cleanup, cleanup)
    }

    try {
      if (isModal) {
        this.emit('change')
      } else {
        ipc.send('wm', 'dialog', { id, type, options })
      }
    } catch (err) {
      this.#settle(id, 'reject', err)
    }

    return promise
  }
}

function t (...args) {
  return instance.localize(...args)
}

function f (message, ...opts) {
  return new IntlMessageFormat(message, ARGS.locale).format(...opts)
}

async function show (type, { message, values, ...opts } = {}) {
  if (message) {
    message = f(message, values)
  }

  return instance.show(type, { message, ...opts })
}

async function notify (id, opts) {
  return show('message-box', {
    type: 'info',
    ...t('dialog', 'notify', ...id.split('.')),
    ...opts
  })
}

async function fail (e, code = e.code, detail) {
  let message = t(`error.${code}`) || e.message

  return show('message-box', {
    type: 'error',
    ...t('dialog', 'error'),
    message,
    detail: detail || e.stack
  }).then(({ response } = {}) => {
    switch (response) {
      case 1:
        copy({ text: crashReport(e, message) })
        break
      case 2:
        ipc.send('shell', 'show', ARGS.log)
        break
    }
  })
}

async function prompt (id, {
  defaultId = 0,
  cancelId = 0,
  isChecked = false,
  ...opts
} = {}) {
  let { response, checked } = await show('message-box', {
    ...t('dialog', 'prompt', ...id.split('.')),
    type: 'question',
    defaultId,
    cancelId,
    checkboxChecked: isChecked,
    ...opts
  }) ?? {}

  let cancel = response == null || response === cancelId

  return {
    ok: !cancel,
    cancel,
    isChecked: checked
  }
}

function save (opts) {
  return show('save', opts)
}

function open (opts) {
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

open.csv = (opts) => open({
  filters: [{
    name: t('dialog', 'filter', 'csv'),
    extensions: ['csv']
  }],
  properties: ['openFile'],
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
  show
}
