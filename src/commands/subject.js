'use strict'

const assert = require('assert')
const { empty, get, pick } = require('../common/util')
const { Command } = require('./command')
const { call, put, select } = require('redux-saga/effects')
const { getTemplateDefaultValues } = require('../selectors')
const mod = require('../models')
const act = require('../actions')


class Save extends Command {
  type = 'item'

  get isUndo() {
    return Array.isArray(this.action.payload)
  }

  *getOriginals(ids, props) {
    let [subjects, metadata] = yield select(state => [
      state[`${this.type}s`],
      state.metadata
    ])

    return ids.map(id => [
      id,
      get(subjects, [id, 'template']),
      props.length ? pick(metadata[id], props, {}, true) : null
    ])
  }

  *restore(originals) {
    let { db } = this.options
    let { meta } = this.action
    let { type } = this
    let changes = { [type]: {} }
    let tmp = {}

    yield call(db.transaction, async tx => {
      for (let [id, template, data] of originals) {
        changes[type][id] = { template, modified: new Date(meta.now) }

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

  *exec() {
    let { db } = this.options
    let { payload, meta } = this.action
    let { type } = this

    if (this.isUndo) {
      let changes = yield this.restore(payload)
      yield put(act[type].bulk.update(changes[type]))

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

      yield put(act[type].bulk.update([id, {
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

module.exports = {
  Save
}
