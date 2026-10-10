import fs from 'node:fs'
import { extname } from 'node:path'
import { call, select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { copy } from '../../clipboard.js'
import { fail, save } from '../../dialog.js'
import { warn } from '../../common/log.js'
import * as slice from '../../slices/transcriptions.js'

export class Export extends Command {
  *exec () {
    let id = this.action.payload
    let { target, format } = this.action.meta

    try {
      let tr = yield select(state => state.transcriptions[id])

      if (!target)
        target = yield call(save.transcription, { alto: !!tr?.data })
      if (!target)
        return

      if (!format)
        format = (tr?.data && extname(target) === '.xml') ? 'alto' : 'text'

      let data = (format === 'text') ? tr?.text : tr?.data

      if (!data)
        return

      if (target === ':clipboard:')
        yield call(copy, { text: data })
      else
        yield call(fs.promises.writeFile, target, data)

    } catch (err) {
      warn({ err }, `failed to export transcription as ${format} to ${target}`)
      fail(err, this.action.type)
    }
  }
}

Export.register(slice.export.type)
