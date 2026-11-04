import { call } from 'redux-saga/effects'
import { Command } from './command.js'
import { search } from '../sagas/search.js'
import * as qr from '../slices/qr.js'

// Updates the current results for the view the user is looking at.
export class Search extends Command {
  *exec () {
    yield call(search, this.options.db)
  }
}

Search.register(qr.search.type)
