import { select } from 'redux-saga/effects'
import { Command } from '../command.js'
import { API } from '../../constants/index.js'
import { pick } from '../../common/util.js'

const PROPS = [
  'items', 'photo', 'selection', 'note', 'list', 'mode', 'query', 'tags'
]

export class NavShow extends Command {
  *exec () {
    return yield select(state => pick(state.nav, PROPS))
  }
}

NavShow.register(API.NAV.SHOW)
