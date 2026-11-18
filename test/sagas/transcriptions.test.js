import { run } from '../support/saga.js'
import { track } from '#tropy/sagas/transcriptions.js'
import { update } from '#tropy/slices/activities.js'
import { update as args } from '#tropy/args.js'

describe('track saga', () => {
  const pending = (...ids) => ids.map(id => ({ id, status: 0 }))

  const state = {
    transcriptions: {
      1: { id: 1, parent: 10, status: 1 },
      2: { id: 2, parent: 20, status: -1 },
      3: { id: 3, parent: 30, status: 1 }
    },
    photos: { 10: { id: 10, item: 100 }, 11: { id: 11, item: 101 } },
    selections: { 30: { id: 30, photo: 11 } },
    nav: { view: { name: 'project' } }
  }

  const puts = (batch, ...ids) =>
    run(track(batch, pending(...ids)), { state }).puts
      .map(({ type, payload, meta }) =>
        type === update.type ? payload : meta.done ? 'done' : type)

  const start = (...ids) =>
    run(track(null, pending(...ids)), { state }).result

  beforeEach(() => {
    args({ account: { linked: true } })
  })

  it('starts a batch for pending transcriptions', () => {
    expect(puts(null, 1)).to.eql([
      'transcription.process',
      'activities/start',
      { total: 1, progress: 1, items: [100] }
    ])
  })

  it('grows the batch as transcriptions become pending', () => {
    let batch = start(1)
    expect(puts(batch, 1, 2, 3))
      .to.eql([{ total: 3, progress: 1, items: [100, 101] }])
  })

  it('advances progress as transcriptions finish', () => {
    let batch = start(1, 2, 3)
    expect(puts(batch, 2, 3))
      .to.eql([{ total: 3, progress: 2, items: [100, 101] }])
  })

  it('searches on updates only while the batch is shown', () => {
    let search = (view) => {
      let batch = start(1, 2)
      batch.handle.meta.seq = 7

      return run(track(batch, pending(1, 2, 3)), {
        state: { ...state, nav: { view } }
      }).puts[0].meta.search
    }

    expect(search({ name: 'project' })).to.be.false
    expect(search({ name: 'activity', type: 'transcription.process', id: 7 }))
      .to.be.true
  })

  it('skips updates when nothing changed', () => {
    let batch = start(1, 2)
    expect(puts(batch, 1, 2)).to.eql([])
  })

  it('ends the batch when nothing is pending', () => {
    let batch = start(1)
    expect(puts(batch)).to.eql(['done'])
  })

  it('ends the batch when the account is unlinked', () => {
    let batch = start(1)
    args({ account: { linked: false } })
    expect(puts(batch, 1)).to.eql(['done'])
  })

  it('tracks nothing while the account is not linked', () => {
    args({ account: { linked: false } })
    expect(run(track(null, pending(1)))).to.include({ result: null })
    expect(puts(null, 1)).to.eql([])
  })

  it('keeps the items of the batch and counts failures', () => {
    let batch = start(1, 2, 3)
    let [{ meta }] = run(track(batch, []), { state }).puts

    expect(meta).to.include({ search: true, errors: 1 })
    expect(meta.items).to.eql([100, 101])
  })

  it('ends the batch, not cancelled, when the account is unlinked', () => {
    let batch = start(1, 3)
    args({ account: { linked: false } })
    let [{ meta }] = run(track(batch, pending(3)), { state }).puts

    expect(meta).not.to.have.property('cancelled')
    expect(meta.items).to.eql([100, 101])
  })
})
