import { call, put, select } from 'redux-saga/effects'
import { createDraft, finishDraft } from 'immer'
import { Command } from '../command.js'
import { PHOTO } from '../../constants/index.js'
import { Cache } from '../../common/cache.js'
import { warn } from '../../common/log.js'
import Esper from '../../esper/index.js'
import { addOrientation } from '../../common/iiif.js'
import win from '../../window.js'
import { update } from '../../slices/transcriptions.js'
import { save } from '../../models/transcription.js'


export class Transcribe extends Command {
  *exec() {
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

      let { buffer, ...raw } = yield call(Esper.instance.extract, src, {
        ...image,
        ...rotation
      })

      if (!config.plugin) {
        throw new Error('not implemented yet')

        // Check if we have a process id already
        // Otherwise upload to transcription service and set process id

      } else {
        next = yield call(
          win.plugins.transcribe,
          config.plugin,
          draft,
          { buffer, ...raw }
        )
      }
    } catch (e) {
      warn({
        image: src,
        stack: e.stack,
        transcription: id
      }, `transcription failed: ${e.message}`)

      next = null
      status = -1
      draft.config.error = e.stack
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

function getTranscriptions(state, props) {
  return props.id.map(id => {
    let tr = state.transcriptions[id]
    let selection = state.selections[tr.parent]
    let photo = state.photos[
      selection == null ? tr.parent : selection.photo
    ]
    return { ...tr, parent: { photo, selection } }
  })
}

Transcribe.register(PHOTO.TRANSCRIBE)
