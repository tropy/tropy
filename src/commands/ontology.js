'use strict'

const { Command } = require('./command')
const { ONTOLOGY } = require('../constants')

class Import extends Command {
  static get action() { return ONTOLOGY.IMPORT }

  *exec() {
    // const { db } = this.options
  }
}

module.exports = {
  Import
}
