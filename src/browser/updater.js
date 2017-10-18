'use strict'

const { autoUpdater } = require('electron')
const { feed } = require('../common/release')
const { linux, win32 } = require('../common/os')
const { warn, info, verbose } = require('../common/log')
const flash  = require('../actions/flash')

const MIN = 1000 * 60

class Updater {
  constructor(app, timeout = 30 * MIN) {
    this.isSupported = !linux &&
      ARGS.environment === 'production' && !ARGS.noUpdates

    this.app = app
    this.timeout = timeout
    this.release = {}

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
      warn(`failed to setup auto updater: ${error.message}`, { error })
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
    clearInterval(this.interval)
  }

  check = () => {
    if (this.isSupported) {
      autoUpdater.checkForUpdates()
    }
  }

  install() {
    if (this.isUpdateReady) {
      autoUpdater.quitAndInstall()
    }
  }

  onError(error) {
    warn(`Failed to fetch update: ${error.message}`, { error })
  }

  onCheckingForUpdate = () =>{
    verbose('checking for updates...')
    this.lastCheck = new Date()
  }

  onUpdateNotAvailable = () => {
    verbose('no updates available')
    this.isUpdateAvailable = false
  }

  onUpdateAvailable = () => {
    info('updates available')
    this.isUpdateAvailable = true
  }

  onUpdateReady = (release) => {
    info(`update ${release.values.version} ready`)
    this.release = release
    this.isUpdateReady = true
    this.app.broadcast('dispatch', flash.show(release))
  }
}

module.exports = Updater
