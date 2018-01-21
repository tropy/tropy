'use strict'

class Plugin {
  constructor(config, context) {
    this.config = config
    this.context = context
  }

  async export() {
    return 42
  }
}

module.exports = Plugin
