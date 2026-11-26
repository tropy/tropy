import {
  nested,
  selectActiveTranscription,
  selectItemTranscriptions,
  selectTranscriptionSuccessor
} from '#tropy/slices/transcriptions.js'

describe('transcriptions (nested)', () => {
  let state = { 1: { id: 1, transcriptions: [] } }
  let done = { done: true }

  it('adds created transcriptions to their parents', () => {
    expect(nested.create(state, {
      payload: { 2: { id: 2, parent: 1 } },
      meta: done
    })).to.have.nested.property('1.transcriptions[0]', 2)
  })

  it('ignores cancelled creates (done without payload)', () => {
    expect(nested.create(state, { meta: done })).to.equal(state)
  })
})

describe('transcriptions selectors', () => {
  describe('selectActiveTranscription', () => {
    let state = (modified) => ({
      photos: { 1: { id: 1, transcriptions: [10, 11, 12] } },
      selections: {},
      transcriptions: {
        10: { id: 10, modified: modified[0] },
        11: { id: 11, modified: modified[1] },
        12: { id: 12, modified: modified[2] }
      }
    })

    it('returns the most recently modified transcription', () => {
      expect(selectActiveTranscription(state(['b', 'c', 'a']), 1))
        .to.have.property('id', 11)
    })

    it('returns the last one of several modified at the same time', () => {
      expect(selectActiveTranscription(state(['a', 'b', 'b']), 1))
        .to.have.property('id', 12)
    })

    it('returns nothing without transcriptions', () => {
      expect(selectActiveTranscription(state([]), 2)).to.be.undefined
    })
  })

  describe('selectTranscriptionSuccessor', () => {
    let state = {
      photos: { 1: { id: 1, transcriptions: [10, 11, 12] } },
      selections: {},
      transcriptions: {
        10: { id: 10, parent: 1, modified: 'a' },
        11: { id: 11, parent: 1, modified: 'c' },
        12: { id: 12, parent: 1, modified: 'b' }
      }
    }

    it('returns the next transcription if the active one is removed', () => {
      expect(selectTranscriptionSuccessor(state, [11])).to.equal(12)
      expect(selectTranscriptionSuccessor(state, [11, 12])).to.equal(10)
    })

    it('returns nothing if the active one is kept or the last', () => {
      expect(selectTranscriptionSuccessor(state, [10])).to.be.null
      expect(selectTranscriptionSuccessor(state, [10, 11, 12])).to.be.null
    })
  })

  describe('selectItemTranscriptions', () => {
    it('returns nothing for unknown items', () => {
      expect(selectItemTranscriptions({ items: {} }, 1)).to.be.null
    })
  })
})
