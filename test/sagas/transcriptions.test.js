import { run } from '../support/saga.js'
import { track } from '#tropy/sagas/transcriptions.js'
import { update } from '#tropy/slices/activities.js'
import { update as args } from '#tropy/args.js'

describe('track saga', () => {
  const pending = (...ids) => ids.map(id => ({ id, status: 0 }))

  const puts = (batch, ...ids) =>
    run(track(batch, pending(...ids))).puts
      .map(({ type, payload, meta }) =>
        type === update.type ? payload : meta.done ? 'done' : type)

  const start = (...ids) =>
    run(track(null, pending(...ids))).result

  beforeEach(() => {
    args({ account: { linked: true } })
  })

  it('starts a batch for pending transcriptions', () => {
    expect(puts(null, 1)).to.eql([
      'transcription.process',
      { total: 1, progress: 1 }
    ])
  })

  it('grows the batch as transcriptions become pending', () => {
    let batch = start(1)
    expect(puts(batch, 1, 2, 3)).to.eql([{ total: 3, progress: 1 }])
  })

  it('advances progress as transcriptions finish', () => {
    let batch = start(1, 2, 3)
    expect(puts(batch, 2, 3)).to.eql([{ total: 3, progress: 2 }])
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
})
