import { call, select } from 'redux-saga/effects'
import { Command } from '../command'
import { API } from '../../constants'
import { Cache } from '../../common/cache'
import { Rotation } from '../../common/iiif'
import { pluck } from '../../common/util'
import Esper from '../../esper'
import { toBuffer } from '../../image'


export class PhotoExtract extends Command {
  *exec() {
    let { cache } = this.options
    let { payload } = this.action

    let { photos, selections } = yield select()
    let photo, selection

    if (payload.selection) {
      selection = selections[payload.selection]
      if (selection == null) return
      photo = photos[selection.photo]

    } else {
      photo = photos[payload.photo]
    }

    if (photo == null) return

    var image = selection || photo
    let src = Cache.url(cache, 'full', photo)

    let { buffer, ...raw } = yield call(Esper.instance.extract, src, {
      ...image,
      ...Rotation.addExifOrientation(image, photo).toJSON()
    })

    let format = payload.format || 'png'
    let data = yield call(toBuffer, format, buffer, { raw })

    return {
      data,
      format
    }
  }
}

PhotoExtract.register(API.PHOTO.EXTRACT)


export class PhotoFind extends Command {
  *exec() {
    let { item } = this.action.payload
    let { items, photos } = yield select()

    if (!(item in items))
      return null

    return pluck(photos, items[item].photos)
  }
}

PhotoFind.register(API.PHOTO.FIND)


export class PhotoShow extends Command {
  *exec() {
    let { id } = this.action.payload
    let photo = yield select(state => state.photos[id])
    return photo
  }
}

PhotoShow.register(API.PHOTO.SHOW)
