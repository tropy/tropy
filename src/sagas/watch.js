import { eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery } from 'redux-saga/effects'
import * as act from '../actions'
import { Watcher } from '../common/watch'
import { debug, warn } from '../common/log'
import { PROJECT } from '../constants'

function addedFilesChannel(watcher) {
  return eventChannel(emitter => {
    let forward = (path) => emitter(path)

    watcher.on('add', forward)

    return () => {
      watcher.off('add', forward)
    }
  })
}

function *updateProjectWatchFolder(watcher) {
  let { project } = yield select()

  if (project.local.watch)
    debug(`updating project watch folder: ${project.local.watch}`)
  else
    debug('clearing project watch folder')

  // TODO add filter for supported files
  yield call([watcher, watcher.watch], project.local.watch)
}

function *closeProject(watcher) {
  yield call([watcher, watcher.stop])
  // TODO update and save watcher timestamp
}

const freshProject = ({ type, meta, error }) =>
  type === PROJECT.OPENED || (
    type === PROJECT.RELOAD && !error && meta.done
  )

export function *watch() {
  try {
    var watcher = new Watcher()
    var channel = yield call(addedFilesChannel, watcher)

    yield takeEvery(freshProject, updateProjectWatchFolder, watcher)
    yield takeEvery(PROJECT.CLOSE, closeProject, watcher)

    while (true) {
      let path = yield take(channel)
      yield put(act.item.import({ files: [path] }, { prompt: false }))
    }

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *watch')

  } finally {
    channel.close()
    yield call([watcher, watcher.stop])
  }
}
