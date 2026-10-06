import { getActiveTranscription } from '#tropy/selectors/index.js'

describe('Transcription Selectors', () => {
  describe('getActiveTranscription', () => {
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
      expect(getActiveTranscription(state(['b', 'c', 'a']), { id: 1 }))
        .to.have.property('id', 11)
    })

    it('returns the last one of several modified at the same time', () => {
      expect(getActiveTranscription(state(['a', 'b', 'b']), { id: 1 }))
        .to.have.property('id', 12)
    })

    it('returns nothing without transcriptions', () => {
      expect(getActiveTranscription(state([]), { id: 2 })).to.be.undefined
    })
  })
})
