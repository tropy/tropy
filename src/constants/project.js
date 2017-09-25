'use strict'

const { join } = require('path')

module.exports = {
  CLOSE: 'project.close',
  CLOSED: 'project.closed',
  CREATE: 'project.create',
  CREATED: 'project.created',
  OPEN: 'project.open',
  OPENED: 'project.opened',
  SAVE: 'project.save',
  UPDATE: 'project.update',

  MODE: {
    PROJECT: 'project',
    ITEM: 'item'
  },

  MIGRATIONS: join(__dirname, '..', '..', 'db', 'migrate', 'project'),
  SCHEMA: join(__dirname, '..', '..', 'db', 'schema', 'project.sql')
}
