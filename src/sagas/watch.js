import { join } from 'node:path'
import { eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery } from 'redux-saga/effects'
import * as act from '../actions/index.js'
import { Watcher } from '../common/watch.js'
import { debug, info, warn } from '../common/log.js'
import { IMAGE, PROJECT } from '../constants/index.js'
import { Storage } from '../storage.js'

function addedFilesChannel(watcher) {
  return eventChannel(emitter => {
    let forward = (path) => emitter(path)

    watcher.on('add', forward)

    return () => {
      watcher.off('add', forward)
    }
  })
}

function *touchProjectWatchFolder() {
  let { project } = yield select()
  let w = Storage.load('project.watch', project.id) || {}

  if (w.folder) {
    w.since = Date.now()
    Storage.save('project.watch', w, project.id)
  }

  return w.since
}

function *updateProjectWatchFolder(watcher) {
  let { project } = yield select()

  let {
    folder,
    since,
    usePolling
  } = Storage.load('project.watch', project.id) || {}

  if (folder) {
    debug(`update project watch folder: ${folder}`)

    let path = join(folder, `*.{${
      IMAGE.EXT.map(ext => `${ext},${ext.toUpperCase()}`).join(',')
    }}`)

    if (watcher.isWatching(path))
      yield call([watcher, watcher.watch], path, { usePolling })
    else
      yield call([watcher, watcher.watch], path, { usePolling, since })

  } else {
    if (watcher.isWatching()) {
      debug('stop project watcher')
      yield call([watcher, watcher.stop])
    }
  }
}

function *closeProject(watcher) {
  yield call([watcher, watcher.stop])
  yield call(touchProjectWatchFolder)
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
      info(`import from watch folder: ${path}`)

      yield put(act.item.import({ files: [path] }, {
        prompt: false,
        duplicate: 'skip'
      }))

      yield call(touchProjectWatchFolder)
    }

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *watch')

  } finally {
    channel.close()
    yield call([watcher, watcher.stop])
  }
}
