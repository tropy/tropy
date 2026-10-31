import assert from 'node:assert'
import { call, put, select } from 'redux-saga/effects'
import { empty, get, pick } from '../common/util.js'
import { Command } from './command.js'
import { getTemplateDefaultValues } from '../selectors/index.js'
import * as mod from '../models/index.js'
import * as act from '../actions/index.js'
import { ITEM, PHOTO, SELECTION } from '../constants/index.js'


export class Save extends Command {
  static subject = 'item'

  get isUndo () {
    return Array.isArray(this.action.payload)
  }

  *getOriginals (ids, props) {
    let [subjects, metadata] = yield select(state => [
      state[`${this.constructor.subject}s`],
      state.metadata
    ])

    return ids.map(id => [
      id,
      get(subjects, [id, 'template']),
      props.length ? pick(metadata[id], props, {}, true) : null
    ])
  }

  *restore (originals) {
    let { db } = this.options
    let { meta } = this.action
    let { subject } = this.constructor
    let changes = { [subject]: {} }
    let tmp = {}

    yield call(db.transaction, async tx => {
      for (let [id, template, data] of originals) {
        changes[subject][id] = { template, modified: new Date(meta.now) }

        await mod.subject.update(tx, {
          id,
          template,
          timestamp: meta.now
        })

        if (data != null) {
          tmp[id] = data
          await mod.metadata.update(tx, { id, data })
        }
      }
    })

    if (!empty(tmp)) changes.data = tmp

    return changes
  }

  *exec () {
    let { db } = this.options
    let { payload, meta } = this.action
    let { subject } = this.constructor

    if (this.isUndo) {
      let changes = yield this.restore(payload)
      yield put(act[subject].bulk.update(changes[subject]))

      if (changes.data) {
        yield put(act.metadata.merge(changes.data))
      }

    } else {
      let { id, property, value: template } = payload

      // Currently the only valid subject save is a template change!
      assert.equal(property, 'template')

      let data = yield select(state =>
        getTemplateDefaultValues(state, { template }))

      let props = Object.keys(data)
      let originals = yield this.getOriginals(id, props)


      yield call(db.transaction, async tx => {
        await mod.subject.update(tx, {
          id,
          template,
          timestamp: meta.now
        })

        if (props.length) {
          await mod.metadata.update(tx, { id, data })
        }
      })

      yield put(act[subject].bulk.update([id, {
        template,
        modified: new Date(meta.now)
      }]))

      if (props.length) {
        yield put(act.metadata.update({ id, data }))
      }

      this.undo = {
        ...this.action,
        payload: originals
      }
    }
  }
}

export class PhotoTemplateChange extends Save {
  static subject = 'photo'
}

PhotoTemplateChange.register(PHOTO.TEMPLATE.CHANGE)


export class ItemTemplateChange extends Save {
  static subject = 'item'
}

ItemTemplateChange.register(ITEM.TEMPLATE.CHANGE)


export class SelectionTemplateChange extends Save {
  static subject = 'selection'
}

SelectionTemplateChange.register(SELECTION.TEMPLATE.CHANGE)

