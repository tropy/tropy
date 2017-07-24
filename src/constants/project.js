'use strict'

const { join } = require('path')

module.exports = {

  OPEN: 'project.open',
  OPENED: 'project.opened',
  CLOSE: 'project.close',
  CLOSED: 'project.closed',

  CREATED: 'project.created',

  SAVE: 'project.save',
  SCHEMA: join(__dirname, '..', '..', 'db', 'schema', 'project.sql'),
  MIGRATIONS: join(__dirname, '..', '..', 'db', 'migrate', 'project'),

  UPDATE: 'project.update',

  MODE: {
    PROJECT: 'project',
    ITEM: 'item'
  }
}
