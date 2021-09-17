import { join } from 'path'
import { eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery } from 'redux-saga/effects'
import * as act from '../actions'
import { Watcher } from '../common/watch'
import { debug, info, warn } from '../common/log'
import { IMAGE, PROJECT } from '../constants'
import mod from '../models/project'

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

  if (project.watch.folder) {
    debug(`update project watch folder: ${project.watch.folder}`)

    let path = join(project.watch.folder, `*.{${
      IMAGE.EXT.map(ext => `${ext},${ext.toUpperCase()}`).join(',')
    }}`)
    let { usePolling, since } = project.watch

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

      let { project } = yield select()
      mod.touchWatchFolder(project.id)
    }

  } catch (e) {
    warn({ stack: e.stack }, 'unexpected error in *watch')

  } finally {
    channel.close()
    yield call([watcher, watcher.stop])
  }
}
