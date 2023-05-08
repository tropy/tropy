import { Command } from '../command'
import { call, select } from 'redux-saga/effects'
import { PHOTO } from '../../constants/index.js'
import { Cache } from '../../common/cache.js'
import { Rotation } from '../../common/iiif.js'
import { warn, info } from '../../common/log.js'
import { blank } from '../../common/util.js'
import Esper from '../../esper/index.js'
import { fail, save } from '../../dialog.js'
import { toFile } from '../../image/index.js'


export class Extract extends Command {
  *exec() {
    try {
      let { cache } = this.options
      let { payload } = this.action

      var file = yield call(save.image)

      if (blank(file)) return

      let [photo, selection] = yield select(state => ([
        state.photos[payload.id],
        state.selections[payload.selection]
      ]))

      var image = selection || photo
      let src = Cache.url(cache.root, 'full', photo)

      let { buffer, ...raw } = yield call(Esper.instance.extract, src, {
        ...image,
        ...Rotation.addExifOrientation(image, photo).toJSON()
      })

      yield call(toFile, file, buffer, { raw })
      info(`saved image #${image.id} as ${file}`)

      return {
        file,
        size: buffer.length
      }

    } catch (e) {
      warn({ stack: e.stack }, `failed to save image #${image.id} as ${file}`)
      fail(e, this.action.type)
    }
  }
}

Extract.register(PHOTO.EXTRACT)
