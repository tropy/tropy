import { call, put, select } from 'redux-saga/effects'
import { createDraft, finishDraft } from 'immer'
import { Command } from '../command.js'
import { PHOTO } from '../../constants/index.js'
import { Cache } from '../../common/cache.js'
import { warn } from '../../common/log.js'
import Esper from '../../esper/index.js'
import { prepare } from '../../image/ocr.js'
import { getTranscription, isLinked, transcribe } from '../../account.js'
import { addOrientation } from '../../common/iiif.js'
import win from '../../window.js'
import { update } from '../../slices/transcriptions.js'
import { save } from '../../models/transcription.js'

export class Transcribe extends Command {
  *exec () {
    let { payload } = this.action

    let transcriptions = yield select(state =>
      getTranscriptions(state, { id: payload }))

    yield this.parallel(transcriptions, this.handleTranscription)
  }

  handleTranscription = function* (transcription, self) {
    let { cache, db } = self.options

    let { id, config, data, text, status } = transcription
    let { photo, selection } = transcription.parent
    let image = selection || photo
    let src = Cache.url(cache.root, 'full', photo)

    let rotation = addOrientation(image, photo)
    let state = { config, data, text, ...rotation }
    let draft = createDraft(state)
    let next

    try {
      if (!config.plugin && config.jobId) {
        let job

        try {
          job = yield call(getTranscription, config.jobId)
        } catch (err) {
          if (err.status === 404 || err.status === 410)
            throw err

          warn({
            err,
            transcription: id,
            job: config.jobId
          }, 'failed to fetch transcription job status')
          return
        }

        updateTranscription(draft, job)

      } else {
        let pixels = yield call(Esper.instance.extract, src, {
          ...image,
          ...rotation
        })
        let img = yield call(prepare, pixels)

        if (!config.plugin) {
          if (!isLinked()) {
            throw new Error('account not linked')
          }

          let job = yield call(transcribe, img, {
            model: config.modelId
          })

          draft.config.jobId = job.id
        } else {
          next = yield call(win.plugins.transcribe, config.plugin, draft, img)
        }
      }
    } catch (err) {
      warn({
        err,
        image: src,
        transcription: id
      }, 'transcription failed')

      next = null
      status = -1
      draft.config.error = err.stack
    }

    if (!next)
      next = finishDraft(draft)

    if (next !== state) {
      if (status === 0 && (next.text || next.data))
        status = 1

      next = { ...next, id, status, modified: new Date }

      yield call(save, db, next)
      yield put(update(next))
    }
  }
}

Transcribe.register(PHOTO.TRANSCRIBE)

function getTranscriptions (state, props) {
  return props.id.map(id => {
    let tr = state.transcriptions[id]
    let selection = state.selections[tr.parent]
    let photo = state.photos[
      selection == null ? tr.parent : selection.photo ]
    return { ...tr, parent: { photo, selection } }
  })
}

function updateTranscription (transcription, job) {
  switch (job.state) {
    case 'completed':
      if (job.output == null)
        throw new Error('transcription completed without output')
      transcription.text = job.output.text
      transcription.data = job.output.alto
      break
    case 'created':
    case 'active':
    case 'suspended':
      break
    default:
      throw new Error(`unknown transcription job state "${job.state}"`)
  }
}
