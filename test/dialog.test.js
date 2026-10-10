import { mock } from 'node:test'
import assert from 'node:assert/strict'
import { ipcRenderer as ipc } from 'electron'
import { DialogService } from '#tropy/dialog.js'

describe('DialogService', () => {
  let service
  let send

  let sent = () => send.mock.calls
    .map(call => call.arguments)
    .filter(([channel, type]) => channel === 'wm' && type === 'dialog')
    .map(([,, dialog]) => dialog)

  const CANCEL = { cancel: true }

  let reply = (id, payload, error) =>
    ipc.emit('dialog', {}, { id, payload, error })

  beforeEach(() => {
    send = mock.method(ipc, 'send', () => {})
    service = new DialogService({ getState: () => ({}) })
    service.start()
  })

  afterEach(() => {
    service.stop()
    send.mock.restore()
  })

  describe('show', () => {
    it('falls back to ipc when detached', async () => {
      service.register('test', () => null)
      let result = service.show('test', { a: 1 })

      expect(service.current).to.be.undefined
      expect(sent()).to.have.length(1)

      let [{ id, options }] = sent()
      expect(options).to.eql({ a: 1 })

      let ok = { cancel: false, value: 'ok', data: null }
      reply(id, ok)
      expect(await result).to.eql(ok)
    })

    it('falls back to ipc for unregistered types', () => {
      service.attach()
      service.show('test')

      expect(service.current).to.be.undefined
      expect(sent()).to.have.length(1)
    })

    it('rejects on ipc errors', async () => {
      let result = service.show('test')
      let [{ id }] = sent()

      reply(id, { message: 'boom' }, true)
      await assert.rejects(result, { message: 'boom' })
    })

    it('queues modals in order', async () => {
      service.register('test', () => null)
      service.attach()

      let handleChange = mock.fn()
      service.on('change', handleChange)

      let a = service.show('test', { n: 1 })
      let b = service.show('test', { n: 2 })

      expect(sent()).to.have.length(0)
      expect(handleChange.mock.callCount()).to.equal(2)

      let first = service.current
      expect(first.options).to.eql({ n: 1 })

      service.close(first.id, 'a')
      expect(await a).to.equal('a')

      let second = service.current
      expect(second.options).to.eql({ n: 2 })

      service.close(second.id, 'b')
      expect(service.current).to.be.undefined
      expect(await b).to.equal('b')
      expect(handleChange.mock.callCount()).to.equal(4)
    })

    it('does not emit change for native dialogs', () => {
      let handleChange = mock.fn()
      service.on('change', handleChange)

      service.show('test')
      service.clear()
      expect(handleChange.mock.callCount()).to.equal(0)
    })

    it('does not send the signal over ipc', () => {
      service.show('test', { a: 1, signal: new AbortController().signal })
      let [{ options }] = sent()
      expect(options).to.eql({ a: 1 })
    })
  })

  describe('close', () => {
    it('cancels any type of dialog without a result', async () => {
      service.register('test', () => null)
      service.attach()

      let results = [
        service.show('test'),
        service.show('message-box', { cancelId: 1, checkboxChecked: true }),
        service.show('file'),
        service.show('save')
      ]

      for (let { id } of sent()) service.close(id)
      service.close(service.current.id)

      expect(await Promise.all(results))
        .to.eql([CANCEL, CANCEL, CANCEL, CANCEL])
    })
  })

  describe('signal', () => {
    it('cancels queued modals on abort', async () => {
      service.register('test', () => null)
      service.attach()

      let ctrl = new AbortController()
      let result = service.show('test', { signal: ctrl.signal })

      ctrl.abort()
      expect(service.current).to.be.undefined
      expect(await result).to.eql(CANCEL)
    })

    it('cancels native dialogs on abort', async () => {
      let ctrl = new AbortController()
      let result = service.show('test', { signal: ctrl.signal })
      let [{ id }] = sent()

      ctrl.abort()
      expect(await result).to.eql(CANCEL)

      reply(id, 'late')
      expect(await result).to.eql(CANCEL)
    })

    it('does not show dialogs for aborted signals', async () => {
      expect(await service.show('test', { signal: AbortSignal.abort() }))
        .to.eql(CANCEL)
      expect(sent()).to.have.length(0)
    })
  })

  describe('clear', () => {
    it('cancels all dialogs', async () => {
      service.register('test', () => null)
      service.attach()

      let results = [
        service.show('test'),
        service.show('test'),
        service.show('native')
      ]

      service.clear()
      expect(service.current).to.be.undefined
      expect(await Promise.all(results)).to.eql([CANCEL, CANCEL, CANCEL])
    })

    it('cancels queued modals on detach', async () => {
      service.register('test', () => null)
      let detach = service.attach()
      let result = service.show('test')

      detach()
      expect(service.current).to.be.undefined
      expect(await result).to.eql(CANCEL)
      expect(service.canShowAsModal('test')).to.be.false
    })

    it('cancels queued modals on unregister', async () => {
      let unregister = service.register('test', () => null)
      service.attach()
      let result = service.show('test')

      unregister()
      expect(service.current).to.be.undefined
      expect(await result).to.eql(CANCEL)
      expect(service.canShowAsModal('test')).to.be.false
    })
  })
})
