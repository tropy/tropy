import { clipboard, nativeImage } from 'electron'
import { Command } from '../command'
import { call, put, select } from 'redux-saga/effects'
import { PHOTO } from '../../constants/index.js'
import { Cache } from '../../common/cache.js'
import { addOrientation } from '../../common/iiif.js'
import { warn, info } from '../../common/log.js'
import Esper from '../../esper/index.js'
import { fail, save } from '../../dialog.js'
import { toBuffer, toFile } from '../../image/index.js'
import * as act from '../../actions/index.js'
import win from '../../window.js'


export class Extract extends Command {
  *exec() {
    try {
      let { cache } = this.options
      let { meta, payload } = this.action
      var { target, plugin } = meta

      if (plugin)
        target = ':plugin:'

      if (!target)
        target = yield call(save.image)
      if (!target)
        return

      let [photo, selection] = yield select(state => ([
        state.photos[payload.id],
        state.selections[payload.selection]
      ]))

      var image = selection || photo
      let src = Cache.url(cache.root, 'full', photo)

      let { buffer, ...raw } = yield call(Esper.instance.extract, src, {
        ...image,
        ...addOrientation(image, photo)
      })

      switch (target) {
        case ':clipboard:': {
          let png = yield call(toBuffer, 'png', buffer, { raw })
          clipboard.writeImage(nativeImage.createFromBuffer(png))
          break
        } case ':plugin:': {
          let res = yield call(win.plugins.extract, plugin, { buffer, ...raw })
          if (res?.note)
            yield put(act.note.create({
              text: res.note,
              photo: photo.id,
              selection: selection?.id
            }))
          break
        }
        default:
          yield call(toFile, target, buffer, { raw })
      }

      info(`extracted image #${image.id} to ${target}`)

      return {
        target,
        size: buffer.length
      }

    } catch (e) {
      warn({
        stack: e.stack
      }, `failed to extract image #${image?.id} to ${target}`)
      fail(e, this.action.type)
    }
  }
}

Extract.register(PHOTO.EXTRACT)
