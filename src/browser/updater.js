import { EventEmitter } from 'events'
import { app, autoUpdater } from 'electron'
import { feed } from '../common/release'
import { linux, win32 } from '../common/os'
import { error, info } from '../common/log'

const MIN = 1000 * 60

export class Updater extends EventEmitter {
  constructor({ enable = true,  interval = 90 * MIN } = {}) {
    super()

    this.isSupported = !linux && enable

    this.timeout = interval
    this.release = {}

    this.isChecking = false
    this.isUpdateAvailable = false
    this.isUpdateReady = false

    if (!this.isSupported) return

    try {
      if (app.runningUnderARM64Translation)
        autoUpdater.setFeedURL(feed.replace('x64', 'arm64'))
      else
        autoUpdater.setFeedURL(feed)

      autoUpdater.on('error', this.onError)
      autoUpdater.on('checking-for-update', this.onCheckingForUpdate)
      autoUpdater.on('update-not-available', this.onUpdateNotAvailable)
      autoUpdater.on('update-available', this.onUpdateAvailable)

      autoUpdater.on('update-downloaded', (event, notes, version) => {
        this.onUpdateReady({
          id: 'update.ready',
          values: { notes, version, date: new Date() }
        })
      })

    } catch (e) {
      this.isSupported = false

      error({
        stack: e.stack
      }, `failed to setup auto updater: ${e.message}`)
    }
  }

  start() {
    this.stop()

    if (this.isSupported) {
      if (win32) setTimeout(this.check, MIN)
      else process.nextTick(this.check)

      this.interval = setInterval(this.check, this.timeout)
    }
  }

  stop() {
    if (this.interval != null) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  get canCheck() {
    return !this.isChecking && !this.isUpdateAvailable
  }

  check = () => {
    if (this.isSupported && this.canCheck) {
      autoUpdater.checkForUpdates()
    }
  }

  install() {
    if (this.isUpdateReady) {
      autoUpdater.quitAndInstall()
    }
  }

  onError(e) {
    this.isChecking = false
    this.isUpdateAvailable = false
    this.isUpdateReady = false

    error({ stack: e.stack }, 'failed to fetch update')
  }

  onCheckingForUpdate = () =>{
    info('checking for updates...')
    this.lastCheck = new Date()
    this.isChecking = true
    this.emit('checking-for-update')
  }

  onUpdateNotAvailable = () => {
    info('no updates available')
    this.isUpdateAvailable = false
    this.isChecking = false
    this.emit('update-not-available')
  }

  onUpdateAvailable = () => {
    info('updates available')
    this.isUpdateAvailable = true
  }

  onUpdateReady = (release) => {
    info(`update ${release.values.version} ready`)
    this.release = release
    this.isUpdateReady = true
    this.isChecking = false
    this.stop()
    this.emit('update-ready', release)
  }
}
