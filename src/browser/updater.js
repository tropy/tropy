'use strict'

const { autoUpdater } = require('electron')
const { feed } = require('../common/release')
const { linux } = require('../common/os')
const { warn, info, verbose } = require('../common/log')
const { noop } = require('../common/util')
const flash  = require('../actions/flash')


class Updater {
  constructor(app, timeout = 1000 * 60 * 30) {
    this.app = app
    this.timeout = timeout

    if (linux) return

    autoUpdater.setFeedURL(feed)

    autoUpdater.on('error', this.onError)
    autoUpdater.on('checking-for-update', this.onCheckingForUpdate)
    autoUpdater.on('update-not-available', this.onUpdateNotAvailable)
    autoUpdater.on('update-available', this.onUpdateAvailable)

    autoUpdater.on('update-downloaded', (event, notes, version) => {
      this.onUpdateReady({
        notes,
        version,
        date: new Date()
      })
    })
  }

  start = (linux) ? noop : () => {
    this.stop()
    this.check()
    this.interval = setInterval(this.check, this.timeout)
  }

  stop() {
    clearInterval(this.interval)
  }

  check = (linux) ? noop : () => {
    autoUpdater.checkForUpdates()
  }

  install() {
    if (this.update != null) {
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

  onNoUpdateAvailable = () => {
    verbose('no updates available')
    this.isUpdateAvailable = false
  }

  onUpdateAvailable = () => {
    info('updates available')
    this.isUpdateAvailable = true
  }

  onUpdateReady = (release) => {
    info(`update ${release.version} ready`)
    this.app.broadcast('dispatch', flash.update({ release }))
    this.isUpdateReady = true
  }
}

module.exports = Updater
