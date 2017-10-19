'use strict'

const { autoUpdater } = require('electron')
const { feed } = require('../common/release')
const { warn, info, verbose } = require('../common/log')
const flash  = require('../actions/flash')


class Updater {
  constructor(app) {
    this.app = app
    autoUpdater.setFeedURL(feed)

    autoUpdater.on('error', (error) => {
      warn(`Failed to fetch update: ${error.message}`, { error })
    })

    autoUpdater.on('checking-for-update', () => {
      this.lastCheck = new Date()
      verbose('checking for updates...')
    })

    autoUpdater.on('update-not-available', () => {
      this.isUpdateAvailable = false
      verbose('no updates available')
    })

    autoUpdater.on('update-available', () => {
      this.isUpdateAvailable = true
      info('update available')
    })

    autoUpdater.on('update-downloaded', (event, notes, version) => {
      this.update = { notes, version, date: new Date() }
      info(`update ${version} downloaded`)

      this.app.broadcast('dispatch', flash.update(this.update))
    })
  }

  start() {
    this.stop()
    this.timeout = setTimeout(this.check, 1000 * 10)
    this.interval = setInterval(this.check, 1000 * 60 * 30)
  }

  stop() {
    clearTimeout(this.timeout)
    clearInterval(this.interval)
  }

  check() {
    autoUpdater.checkForUpdates()
  }

  install() {
    if (this.update != null) {
      autoUpdater.quitAndInstall()
    }
  }
}

module.exports = Updater
