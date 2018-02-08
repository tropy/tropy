'use strict'

const { autoUpdater } = require('electron')
const { feed } = require('../common/release')
const { linux, win32 } = require('../common/os')
const { warn, info, verbose } = require('../common/log')
const flash  = require('../actions/flash')

const MIN = 1000 * 60

class Updater {
  constructor(app, timeout = 90 * MIN) {
    this.isSupported = !linux && app.isBuild && ARGS.autoUpdates

    this.app = app
    this.timeout = timeout
    this.release = {}

    this.isChecking = false
    this.isUpdateAvailable = false
    this.isUpdateReady = false

    if (!this.isSupported) return

    try {
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

    } catch (error) {
      warn(`failed to setup auto updater: ${error.message}`, {
        stack: error.stack
      })
      this.isSupported = false
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

  onError(error) {
    this.isChecking = false
    this.isUpdateAvailable = false
    this.isUpdateReady = false

    warn(`Failed to fetch update: ${error.message}`, {
      stack: error.stack
    })
  }

  onCheckingForUpdate = () =>{
    verbose('checking for updates...')
    this.lastCheck = new Date()
    this.isChecking = true
    this.app.emit('app:reload-menu')
  }

  onUpdateNotAvailable = () => {
    verbose('no updates available')
    this.isUpdateAvailable = false
    this.isChecking = false
    this.app.emit('app:reload-menu')
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
    this.app.broadcast('dispatch', flash.show(release))
    this.stop()
  }
}

module.exports = Updater
