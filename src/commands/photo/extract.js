import { basename, extname } from 'node:path'
import { clipboard, nativeImage } from 'electron'
import { Command } from '../command'
import { call, select } from 'redux-saga/effects'
import { PHOTO, MIME } from '../../constants/index.js'
import { Cache } from '../../common/cache.js'
import { addOrientation } from '../../common/iiif.js'
import { warn, info } from '../../common/log.js'
import Esper from '../../esper/index.js'
import { fail, save } from '../../dialog.js'
import { toBuffer, toFile } from '../../image/index.js'


export class Extract extends Command {
  *exec() {
    try {
      let { cache } = this.options
      let { meta, payload } = this.action
      var { target } = meta

      let [photo, selection] = yield select(state => ([
        state.photos[payload.id],
        state.selections[payload.selection]
      ]))

      if (!target)
        target = yield call(save.image, {
          filename: getFilenameFor(photo, selection)
        })
      if (!target)
        return

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

function getFilenameFor({ filename, mimetype }, selection) {
  let base = basename(filename, extname(filename))
  let suffix = ''

  if (selection) {
    let { x, y, width, height } = selection
    suffix = `-${x}_${y}-${width}x${height}`
  }

  switch (mimetype) {
    case MIME.JPEG:
    case MIME.PDF:
    case MIME.TIFF:
      return `${base}${suffix}.jpg`
    default:
      return `${base}${suffix}.png`
  }
}

Extract.register(PHOTO.EXTRACT)
