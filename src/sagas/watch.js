import { extname } from 'node:path'
import { eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery } from 'redux-saga/effects'
import * as act from '../actions/index.js'
import { Watcher } from '../common/watch.js'
import { debug, info, warn } from '../common/log.js'
import { IMAGE, PROJECT } from '../constants/index.js'
import { Storage } from '../storage.js'

const ignored = (path, stats) =>
  stats?.isFile() && !IMAGE.EXT.includes(
    extname(path).slice(1).toLowerCase()
  )

function addedFilesChannel (watcher) {
  return eventChannel(emitter => {
    let forward = (path) => emitter(path)

    watcher.on('add', forward)

    return () => {
      watcher.off('add', forward)
    }
  })
}

function *touchProjectWatchFolder () {
  let { project } = yield select()
  let w = Storage.load('project.watch', project.id) || {}

  if (w.folder) {
    w.since = Date.now()
    Storage.save('project.watch', w, project.id)
  }

  return w.since
}

function *updateProjectWatchFolder (watcher) {
  let { project } = yield select()

  let {
    folder,
    since,
    usePolling
  } = Storage.load('project.watch', project.id) || {}

  if (folder) {
    debug({ path: folder }, 'update project watch folder')

    if (watcher.isWatching(folder))
      yield call([watcher, watcher.watch], folder, { usePolling, ignored })
    else
      yield call([watcher, watcher.watch], folder, { usePolling, ignored, since })

  } else {
    if (watcher.isWatching()) {
      debug('stop project watcher')
      yield call([watcher, watcher.stop])
    }
  }
}

function *closeProject (watcher) {
  yield call([watcher, watcher.stop])
  yield call(touchProjectWatchFolder)
}

// Once the project is loaded, so that files added meanwhile
// are imported into a ready project.
const freshProject = ({ type, meta, error }) =>
  type === PROJECT.READY || (
    type === PROJECT.RELOAD && !error && meta.done
  )

export function *watch () {
  try {
    var watcher = new Watcher()
    var channel = yield call(addedFilesChannel, watcher)

    yield takeEvery(freshProject, updateProjectWatchFolder, watcher)
    yield takeEvery(PROJECT.CLOSE, closeProject, watcher)

    while (true) {
      let path = yield take(channel)
      info({ path }, 'import from watch folder')

      yield put(act.item.import({ files: [path] }, {
        prompt: false,
        duplicate: 'skip'
      }))

      yield call(touchProjectWatchFolder)
    }

  } catch (err) {
    warn({ err }, 'unexpected error in *watch')

  } finally {
    channel.close()
    yield call([watcher, watcher.stop])
  }
}
