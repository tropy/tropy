import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'
import { pluck } from '../../common/util.js'


export class PhotoFind extends Command {
  *exec () {
    let { item } = this.action.payload
    let { items, photos } = yield select()

    if (!(item in items))
      return null

    return pluck(photos, items[item].photos)
  }
}

PhotoFind.register(API.PHOTO.FIND)


export class PhotoShow extends Command {
  *exec () {
    let { id } = this.action.payload
    let photo = yield select(state => state.photos[id])
    return photo
  }
}

PhotoShow.register(API.PHOTO.SHOW)
